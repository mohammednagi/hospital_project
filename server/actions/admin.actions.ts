import { prisma } from "@/lib/db";
import { HospitalType } from "@prisma/client";

export async function generateSlotsAction({
  hospitalId,
  startDate,
  days = 14,
  actorId,
}: {
  hospitalId: string;
  startDate?: Date | string;
  days?: number;
  actorId: string;
}) {
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);

  // Fetch all clinics and doctors for this hospital
  const clinics = await prisma.clinic.findMany({
    where: { hospitalId, isActive: true },
    include: {
      doctors: {
        include: {
          schedules: true,
          blackoutDays: true,
        },
      },
    },
  });

  // Also fetch hospital-level blackout days
  const hospitalBlackouts = await prisma.blackoutDay.findMany({
    where: { hospitalId },
  });

  let slotsCreatedCount = 0;

  for (const clinic of clinics) {
    for (const doctor of clinic.doctors) {
      if (doctor.schedules.length === 0) continue;

      for (let d = 0; d < days; d++) {
        const targetDate = new Date(start);
        targetDate.setDate(targetDate.getDate() + d);
        const weekday = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Check if hospital or doctor has a blackout on this date
        const isHospitalBlackout = hospitalBlackouts.some(
          (b) => b.date.toDateString() === targetDate.toDateString()
        );
        const isDoctorBlackout = doctor.blackoutDays.some(
          (b) => b.date.toDateString() === targetDate.toDateString()
        );

        if (isHospitalBlackout || isDoctorBlackout) continue;

        // Match schedules for this weekday
        const matchingSchedules = doctor.schedules.filter(
          (s) => s.weekday === weekday
        );

        for (const sched of matchingSchedules) {
          const [startHour, startMin] = sched.startTime.split(":").map(Number);
          const [endHour, endMin] = sched.endTime.split(":").map(Number);

          const slotDurationMinutes = sched.slotMinutes || 15;
          const currentSlotStart = new Date(targetDate);
          currentSlotStart.setHours(startHour, startMin, 0, 0);

          const scheduleEnd = new Date(targetDate);
          scheduleEnd.setHours(endHour, endMin, 0, 0);

          while (currentSlotStart < scheduleEnd) {
            const currentSlotEnd = new Date(currentSlotStart);
            currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + slotDurationMinutes);

            // Idempotency check: check if slot already exists for doctor at this time
            const existing = await prisma.slot.findFirst({
              where: {
                doctorId: doctor.id,
                clinicId: clinic.id,
                startsAt: currentSlotStart,
              },
            });

            if (!existing) {
              await prisma.slot.create({
                data: {
                  clinicId: clinic.id,
                  doctorId: doctor.id,
                  startsAt: currentSlotStart,
                  endsAt: currentSlotEnd,
                  capacity: sched.capacityPerSlot || 2,
                  bookedCount: 0,
                  overbookAllowance: 1,
                },
              });
              slotsCreatedCount++;
            }

            currentSlotStart.setMinutes(currentSlotStart.getMinutes() + slotDurationMinutes);
          }
        }
      }
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "SLOTS_GENERATED",
      entity: "Hospital",
      entityId: hospitalId,
      meta: { days, slotsCreatedCount, startDate: start.toISOString() },
    },
  });

  return { success: true, slotsCreatedCount };
}

export async function createBlackoutDayAction({
  hospitalId,
  doctorId,
  date,
  reason,
  actorId,
}: {
  hospitalId?: string;
  doctorId?: string;
  date: Date | string;
  reason: string;
  actorId: string;
}) {
  const blackoutDate = new Date(date);
  blackoutDate.setHours(0, 0, 0, 0);

  const blackout = await prisma.blackoutDay.create({
    data: {
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
      date: blackoutDate,
      reason,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "BLACKOUT_CREATED",
      entity: "BlackoutDay",
      entityId: blackout.id,
      meta: { hospitalId, doctorId, date: blackoutDate.toISOString(), reason },
    },
  });

  return blackout;
}

export async function onboardHospitalAction({
  governorateId,
  nameAr,
  nameEn,
  type = HospitalType.GENERAL,
  address,
  phone,
  lat,
  lng,
  actorId,
}: {
  governorateId: string;
  nameAr: string;
  nameEn: string;
  type?: HospitalType;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  actorId: string;
}) {
  const hospital = await prisma.hospital.create({
    data: {
      governorateId,
      nameAr,
      nameEn,
      type,
      address,
      phone,
      lat,
      lng,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "HOSPITAL_ONBOARDED",
      entity: "Hospital",
      entityId: hospital.id,
      meta: { nameAr, nameEn, governorateId },
    },
  });

  return hospital;
}
