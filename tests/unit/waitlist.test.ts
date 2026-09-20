import { describe, it, expect } from "vitest";
import {
  selectWaitlistPromotionCandidate,
  isOfferExpired,
  createWaitlistOffer,
  type WaitlistEntryData,
  type SlotData,
} from "@/lib/smart/waitlist";

describe("Smart Module: waitlist promotion & expiry", () => {
  const baseTime = new Date("2026-09-20T10:00:00Z");

  const mockSlot: SlotData = {
    id: "slot-freed-1",
    clinicId: "clinic-int",
    startsAt: "2026-09-22T09:00:00Z",
  };

  it("should return hasCandidate: false when waitlist is empty", () => {
    const res = selectWaitlistPromotionCandidate([], mockSlot, baseTime);
    expect(res.hasCandidate).toBe(false);
  });

  it("should enforce strict FIFO fairness by selecting the oldest WAITING candidate", () => {
    const entries: WaitlistEntryData[] = [
      {
        id: "w-recent",
        patientId: "p-recent",
        clinicId: "clinic-int",
        preferredDate: "2026-09-22",
        status: "WAITING",
        createdAt: new Date("2026-09-19T14:00:00Z"),
      },
      {
        id: "w-oldest",
        patientId: "p-oldest",
        clinicId: "clinic-int",
        preferredDate: "2026-09-22",
        status: "WAITING",
        createdAt: new Date("2026-09-18T08:00:00Z"), // 1 day earlier
      },
      {
        id: "w-other-clinic",
        patientId: "p-other",
        clinicId: "clinic-other",
        preferredDate: "2026-09-22",
        status: "WAITING",
        createdAt: new Date("2026-09-17T08:00:00Z"),
      },
    ];

    const result = selectWaitlistPromotionCandidate(entries, mockSlot, baseTime);
    expect(result.hasCandidate).toBe(true);
    expect(result.selectedEntry?.id).toBe("w-oldest");
    expect(result.selectedEntry?.patientId).toBe("p-oldest");

    // Expiry should be exactly 2 hours from baseTime
    const expectedExpiry = new Date(baseTime.getTime() + 2 * 60 * 60 * 1000);
    expect(result.offerExpiresAt?.toISOString()).toBe(expectedExpiry.toISOString());
  });

  it("should correctly detect if an offer has expired using mocked clock", () => {
    const offerExpiresAt = new Date("2026-09-20T12:00:00Z");

    // 11:59:59 (1 second before) -> not expired
    const timeBefore = new Date("2026-09-20T11:59:59Z");
    expect(isOfferExpired(offerExpiresAt, timeBefore)).toBe(false);

    // 12:00:00 (exact expiry) -> expired
    const timeExact = new Date("2026-09-20T12:00:00Z");
    expect(isOfferExpired(offerExpiresAt, timeExact)).toBe(true);

    // 12:05:00 (after expiry) -> expired
    const timeAfter = new Date("2026-09-20T12:05:00Z");
    expect(isOfferExpired(offerExpiresAt, timeAfter)).toBe(true);

    // null / undefined -> considered expired
    expect(isOfferExpired(null, timeAfter)).toBe(true);
  });

  it("should properly format updated waitlist entry on promotion", () => {
    const entry: WaitlistEntryData = {
      id: "w1",
      patientId: "p1",
      clinicId: "c1",
      preferredDate: "2026-09-22",
      status: "WAITING",
      createdAt: baseTime,
    };

    const updated = createWaitlistOffer(entry, "slot-99", baseTime, 2);
    expect(updated.status).toBe("OFFERED");
    expect(updated.offeredSlotId).toBe("slot-99");
    expect(updated.offerExpiresAt).toBeDefined();
  });

  it("should return hasCandidate: false when entries exist but none are WAITING for target clinic", () => {
    const entries: WaitlistEntryData[] = [
      {
        id: "w-other",
        patientId: "p1",
        clinicId: "other-clinic",
        preferredDate: "2026-09-22",
        status: "WAITING",
        createdAt: baseTime,
      },
      {
        id: "w-accepted",
        patientId: "p2",
        clinicId: "clinic-int",
        preferredDate: "2026-09-22",
        status: "ACCEPTED",
        createdAt: baseTime,
      },
    ];

    const result = selectWaitlistPromotionCandidate(entries, mockSlot, baseTime);
    expect(result.hasCandidate).toBe(false);
    expect(result.reason).toContain("No eligible WAITING entries");
  });
});
