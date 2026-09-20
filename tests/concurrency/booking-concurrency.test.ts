import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { bookSlotAtomic } from "@/server/actions/appointment.actions";
import { BookingSource, PriorityLane } from "@prisma/client";

describe("Concurrency Test: Zero Double-Booking Guarantee", () => {
  let testClinicId: string;
  let testDoctorId: string;
  let testSlotId: string;
  let patientIds: string[] = [];

  beforeAll(async () => {
    // 1. Fetch or create a test clinic and doctor
    const clinic = await prisma.clinic.findFirstOrThrow({
      include: { doctors: true },
    });
    testClinicId = clinic.id;
    testDoctorId = clinic.doctors[0].id;

    // 2. Create an isolated test slot with STRICT capacity = 2, overbookAllowance = 0
    const startsAt = new Date("2026-11-15T10:00:00Z");
    const endsAt = new Date("2026-11-15T10:15:00Z");

    const slot = await prisma.slot.create({
      data: {
        clinicId: testClinicId,
        doctorId: testDoctorId,
        startsAt,
        endsAt,
        capacity: 2,
        bookedCount: 0,
        overbookAllowance: 0, // Zero overbook allowed for strict concurrency assertion
      },
    });
    testSlotId = slot.id;

    // 3. Fetch 20 test patients
    const patients = await prisma.user.findMany({
      where: { role: "PATIENT" },
      take: 20,
    });
    patientIds = patients.map((p) => p.id);
  });

  afterAll(async () => {
    // Clean up test data
    if (testSlotId) {
      await prisma.appointment.deleteMany({ where: { slotId: testSlotId } });
      await prisma.slot.delete({ where: { id: testSlotId } }).catch(() => {});
    }
  });

  it("should fire 20 parallel bookings at a capacity-2 slot and assert EXACTLY 2 succeed", async () => {
    // Fire 20 parallel booking attempts simultaneously
    const bookingPromises = patientIds.map((patientId) =>
      bookSlotAtomic({
        slotId: testSlotId,
        patientId,
        source: BookingSource.WEB,
        priorityLane: PriorityLane.NONE,
      })
    );

    const results = await Promise.allSettled(bookingPromises);

    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    console.log(`Concurrency Results: ${successful.length} succeeded, ${failed.length} rejected.`);

    // Strict concurrency assertions
    expect(successful.length).toBe(2);
    expect(failed.length).toBe(18);

    // Verify all 18 failed with SLOT_CAPACITY_EXCEEDED
    for (const failure of failed) {
      if (failure.status === "rejected") {
        expect(failure.reason.message).toContain("SLOT_CAPACITY_EXCEEDED");
      }
    }

    // Verify database state matches exactly
    const slotInDb = await prisma.slot.findUniqueOrThrow({
      where: { id: testSlotId },
    });
    expect(slotInDb.bookedCount).toBe(2);

    const apptsInDb = await prisma.appointment.count({
      where: { slotId: testSlotId },
    });
    expect(apptsInDb).toBe(2);
  });
});
