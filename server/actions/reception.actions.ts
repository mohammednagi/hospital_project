import { prisma } from "@/lib/db";
import { AppointmentStatus, BookingSource, PriorityLane } from "@prisma/client";
import { computePriorityLane } from "@/lib/smart/priority-lane";
import { parseNationalId } from "@/lib/smart/national-id";

export async function receptionCheckInAction(
  ticketNoOrNationalId: string,
  actorId: string
) {
  const query = ticketNoOrNationalId.trim();

  // Find appointment by ticketNo or by citizen's nationalId for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointment = await prisma.appointment.findFirst({
    where: {
      OR: [
        { ticketNo: query },
        {
          patient: { nationalId: query },
          slot: {
            startsAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      ],
      status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED] },
    },
    include: {
      patient: true,
      slot: {
        include: {
          clinic: {
            include: { specialty: true, hospital: true },
          },
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("No active booking found for today with this ticket or National ID");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: AppointmentStatus.CHECKED_IN,
      checkedInAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "PATIENT_CHECKED_IN",
      entity: "Appointment",
      entityId: appointment.id,
      meta: {
        ticketNo: appointment.ticketNo,
        queueNo: appointment.queueNo,
        checkedInAt: new Date().toISOString(),
      },
    },
  });

  return updated;
}

export async function receptionWalkInBookingAction({
  clinicId,
  nationalId,
  fullNameAr,
  fullNameEn,
  phone,
  hasDisability = false,
  isPregnant = false,
  actorId,
}: {
  clinicId: string;
  nationalId: string;
  fullNameAr: string;
  fullNameEn: string;
  phone: string;
  hasDisability?: boolean;
  isPregnant?: boolean;
  actorId: string;
}) {
  const nidResult = parseNationalId(nationalId);
  if (!nidResult.isValid || !nidResult.birthDate || !nidResult.gender) {
    throw new Error(nidResult.error || "Invalid National ID");
  }

  // Find or create patient User
  let patient = await prisma.user.findUnique({
    where: { nationalId },
  });

  if (!patient) {
    const defaultGov = await prisma.governorate.findFirstOrThrow();
    patient = await prisma.user.create({
      data: {
        nationalId,
        fullNameAr,
        fullNameEn,
        phone,
        passwordHash: "WALK_IN_RECEPTION_USER",
        role: "PATIENT",
        birthDate: nidResult.birthDate,
        gender: nidResult.gender,
        governorateId: defaultGov.id,
        hasDisability,
        isPregnant,
      },
    });
  }

  // Find current active slot for today for this clinic
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Find slot that has capacity or overbook allowance
  const availableSlot = await prisma.slot.findFirst({
    where: {
      clinicId,
      startsAt: { gte: now, lte: endOfDay },
    },
    orderBy: { startsAt: "asc" },
  });

  if (!availableSlot) {
    throw new Error("No available clinic slots remaining for today");
  }

  // Check capacity + overbook allowance atomically
  return await prisma.$transaction(async (tx) => {
    const updatedRows = await tx.$executeRaw`
      UPDATE "Slot"
      SET "bookedCount" = "bookedCount" + 1
      WHERE "id" = ${availableSlot.id} AND "bookedCount" < ("capacity" + "overbookAllowance")
    `;

    if (updatedRows === 0) {
      throw new Error("Clinic is fully booked for this slot (capacity & overbook limit reached)");
    }

    const slot = await tx.slot.findUniqueOrThrow({
      where: { id: availableSlot.id },
      include: {
        clinic: { include: { specialty: true, hospital: true } },
      },
    });

    const queueNo = slot.bookedCount;
    const dateStr = slot.startsAt.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNo = `WALK-${slot.clinic.specialty.code}-${dateStr}-${randomSuffix}`;

    const lane: PriorityLane = computePriorityLane({
      birthDate: patient.birthDate,
      hasDisability,
      isPregnant,
    });

    const appointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        slotId: slot.id,
        status: AppointmentStatus.CHECKED_IN, // Walk-in is immediately present at reception
        checkedInAt: new Date(),
        ticketNo,
        queueNo,
        source: BookingSource.RECEPTION,
        priorityLane: lane,
        noShowRiskScore: 0.05, // Walk-in is already physically present
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "RECEPTION_WALK_IN_BOOKED",
        entity: "Appointment",
        entityId: appointment.id,
        meta: {
          slotId: slot.id,
          ticketNo,
          queueNo,
          clinicId,
          patientId: patient.id,
        },
      },
    });

    return appointment;
  });
}
