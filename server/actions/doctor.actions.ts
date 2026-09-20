import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";

export async function doctorCallNextAction(
  appointmentId: string,
  doctorUserId: string
) {
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
  });

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.IN_PROGRESS,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: doctorUserId,
      action: "DOCTOR_CALL_PATIENT",
      entity: "Appointment",
      entityId: appointmentId,
      meta: { ticketNo: appointment.ticketNo, queueNo: appointment.queueNo },
    },
  });

  return updated;
}

export async function doctorCompleteConsultationAction({
  appointmentId,
  outcomeNote,
  doctorUserId,
}: {
  appointmentId: string;
  outcomeNote?: string;
  doctorUserId: string;
}) {
  if (outcomeNote && outcomeNote.length > 280) {
    throw new Error("Outcome note exceeds 280 characters limit");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.COMPLETED,
      completedAt: new Date(),
      outcomeNote: outcomeNote?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: doctorUserId,
      action: "APPOINTMENT_COMPLETED",
      entity: "Appointment",
      entityId: appointmentId,
      meta: {
        completedAt: new Date().toISOString(),
        hasOutcomeNote: !!outcomeNote,
      },
    },
  });

  return updated;
}

export async function doctorMarkNoShowAction(
  appointmentId: string,
  doctorUserId: string
) {
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: { slot: true },
  });

  const now = new Date();
  const slotStart = new Date(appointment.slot.startsAt);
  const diffMinutes = (now.getTime() - slotStart.getTime()) / (1000 * 60);

  // In demo prototype, we enforce that slot start must have elapsed by at least 15 min,
  // or allow if slot was in past
  if (diffMinutes < 15 && now < slotStart) {
    throw new Error("15-minute grace period has not elapsed yet");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.NO_SHOW,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: doctorUserId,
      action: "APPOINTMENT_NO_SHOW",
      entity: "Appointment",
      entityId: appointmentId,
      meta: {
        slotStartsAt: appointment.slot.startsAt.toISOString(),
        markedAt: now.toISOString(),
      },
    },
  });

  return updated;
}
