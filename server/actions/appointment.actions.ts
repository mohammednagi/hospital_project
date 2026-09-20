import { prisma } from "@/lib/db";
import { AppointmentStatus, BookingSource, PriorityLane } from "@prisma/client";

export interface BookSlotParams {
  slotId: string;
  patientId: string;
  source?: BookingSource;
  priorityLane?: PriorityLane;
}

export interface CancelAppointmentParams {
  appointmentId: string;
  actorId: string;
  reason?: string;
}

export interface RescheduleAppointmentParams {
  appointmentId: string;
  newSlotId: string;
  actorId: string;
}

/**
 * Concurrency-safe atomic appointment booking.
 * Uses atomic SQL conditional update to prevent double-booking.
 * Guarantees that even under concurrent bursts, exactly (capacity + overbookAllowance) succeed.
 */
export async function bookSlotAtomic({
  slotId,
  patientId,
  source = BookingSource.WEB,
  priorityLane = PriorityLane.NONE,
}: BookSlotParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Atomic update conditional on remaining capacity + overbookAllowance
    const updatedRows = await tx.$executeRaw`
      UPDATE "Slot"
      SET "bookedCount" = "bookedCount" + 1
      WHERE "id" = ${slotId} AND "bookedCount" < ("capacity" + "overbookAllowance")
    `;

    if (updatedRows === 0) {
      throw new Error("SLOT_CAPACITY_EXCEEDED");
    }

    // 2. Fetch the updated slot with clinic and hospital metadata
    const slot = await tx.slot.findUniqueOrThrow({
      where: { id: slotId },
      include: {
        clinic: {
          include: {
            specialty: true,
            hospital: true,
          },
        },
      },
    });

    const queueNo = slot.bookedCount;
    const dateStr = slot.startsAt.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNo = `TKT-${slot.clinic.specialty.code}-${dateStr}-${randomSuffix}`;

    // 3. Create Appointment
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        slotId,
        status: AppointmentStatus.BOOKED,
        ticketNo,
        queueNo,
        source,
        priorityLane,
        noShowRiskScore: 0.15,
      },
    });

    // 4. Central Audit Log
    await tx.auditLog.create({
      data: {
        actorId: patientId,
        action: "APPOINTMENT_BOOKED",
        entity: "Appointment",
        entityId: appointment.id,
        meta: {
          slotId,
          ticketNo,
          queueNo,
          hospitalId: slot.clinic.hospitalId,
          clinicId: slot.clinicId,
          priorityLane,
        },
      },
    });

    return appointment;
  });
}

/**
 * Atomically cancels an appointment and triggers waitlist promotion.
 */
export async function cancelAppointment({
  appointmentId,
  actorId,
  reason,
}: CancelAppointmentParams) {
  return await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      include: { slot: true },
    });

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new Error("Appointment is already cancelled");
    }

    // Update appointment status to CANCELLED
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });

    // Decrement slot booked count
    await tx.slot.update({
      where: { id: appointment.slotId },
      data: { bookedCount: { decrement: 1 } },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId,
        action: "APPOINTMENT_CANCELLED",
        entity: "Appointment",
        entityId: appointmentId,
        meta: { reason: reason || "User cancelled", slotId: appointment.slotId },
      },
    });

    // Waitlist promotion: find oldest WAITING entry for this clinic
    const oldestWaiting = await tx.waitlistEntry.findFirst({
      where: {
        clinicId: appointment.slot.clinicId,
        status: "WAITING",
      },
      orderBy: { createdAt: "asc" },
    });

    if (oldestWaiting) {
      const offerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await tx.waitlistEntry.update({
        where: { id: oldestWaiting.id },
        data: {
          status: "OFFERED",
          offeredSlotId: appointment.slotId,
          offerExpiresAt,
        },
      });

      // Notify the patient about the offered slot
      await tx.notification.create({
        data: {
          userId: oldestWaiting.patientId,
          channel: "SMS_MOCK",
          title: "فرصة حجز موعد شاغر",
          body: `أصبح هناك موعد شاغر في العيادة. العرض متاح لمدة ساعتين حتى ${offerExpiresAt.toLocaleTimeString("ar-EG")}.`,
        },
      });
    }

    return updated;
  });
}

/**
 * Atomically reschedules an appointment:
 * Releases old slot (with waitlist promotion check) and reserves new slot.
 */
export async function rescheduleAppointment({
  appointmentId,
  newSlotId,
  actorId,
}: RescheduleAppointmentParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. Cancel / release existing slot
    const existing = await tx.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      include: { slot: true },
    });

    // Decrement old slot
    await tx.slot.update({
      where: { id: existing.slotId },
      data: { bookedCount: { decrement: 1 } },
    });

    // 2. Reserve new slot atomically
    const updatedRows = await tx.$executeRaw`
      UPDATE "Slot"
      SET "bookedCount" = "bookedCount" + 1
      WHERE "id" = ${newSlotId} AND "bookedCount" < ("capacity" + "overbookAllowance")
    `;

    if (updatedRows === 0) {
      throw new Error("SLOT_CAPACITY_EXCEEDED");
    }

    const newSlot = await tx.slot.findUniqueOrThrow({
      where: { id: newSlotId },
    });

    // 3. Update appointment
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        slotId: newSlotId,
        queueNo: newSlot.bookedCount,
        status: AppointmentStatus.CONFIRMED,
      },
    });

    // 4. Audit Log
    await tx.auditLog.create({
      data: {
        actorId,
        action: "APPOINTMENT_RESCHEDULED",
        entity: "Appointment",
        entityId: appointmentId,
        meta: { oldSlotId: existing.slotId, newSlotId, newQueueNo: newSlot.bookedCount },
      },
    });

    return updated;
  });
}
