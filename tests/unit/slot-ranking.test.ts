import { describe, it, expect } from "vitest";
import {
  haversineDistance,
  rankSlots,
  type SlotCandidate,
} from "@/lib/smart/slot-ranking";

describe("Smart Module: rankSlots & haversineDistance", () => {
  it("should calculate realistic Haversine distance between Cairo and Alexandria (~180 km)", () => {
    const cairo = { lat: 30.0444, lng: 31.2357 };
    const alex = { lat: 31.2001, lng: 29.9187 };
    const dist = haversineDistance(cairo, alex);
    expect(dist).toBeGreaterThan(160);
    expect(dist).toBeLessThan(200);
  });

  it("should return empty list when no candidate slots are provided", () => {
    const res = rankSlots([], { lat: 30.0444, lng: 31.2357 });
    expect(res).toEqual([]);
  });

  it("should rank sooner, closer, and lower-load slots higher", () => {
    const now = new Date("2026-09-20T09:00:00Z");

    const candidateSlots: SlotCandidate[] = [
      {
        id: "slot-far-future",
        clinicId: "c1",
        doctorId: "d1",
        startsAt: new Date("2026-10-02T10:00:00Z"), // 12 days later
        endsAt: new Date("2026-10-02T10:15:00Z"),
        capacity: 2,
        bookedCount: 2, // 100% loaded
        hospital: {
          id: "h-alex",
          nameAr: "مستشفى الإسكندرية",
          nameEn: "Alex Hospital",
          lat: 31.2001,
          lng: 29.9187, // ~180 km from Cairo
        },
      },
      {
        id: "slot-near-soon",
        clinicId: "c2",
        doctorId: "d2",
        startsAt: new Date("2026-09-21T09:00:00Z"), // 1 day later
        endsAt: new Date("2026-09-21T09:15:00Z"),
        capacity: 3,
        bookedCount: 0, // 0% loaded
        hospital: {
          id: "h-cairo",
          nameAr: "مستشفى قصر العيني",
          nameEn: "Kasr Al Aini",
          lat: 30.0305,
          lng: 31.2285, // ~2 km from Cairo center
        },
      },
    ];

    const ranked = rankSlots(candidateSlots, { lat: 30.0444, lng: 31.2357 }, {
      now,
      locale: "ar",
    });

    expect(ranked.length).toBe(2);
    // slot-near-soon must be ranked first (#0)
    expect(ranked[0].slot.id).toBe("slot-near-soon");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].reason).toContain("كم");
  });

  it("should generate proper human-readable reason in English", () => {
    const now = new Date("2026-09-20T09:00:00Z");
    const candidates: SlotCandidate[] = [
      {
        id: "slot-1",
        clinicId: "c1",
        doctorId: "d1",
        startsAt: new Date("2026-09-21T09:00:00Z"),
        endsAt: new Date("2026-09-21T09:15:00Z"),
        capacity: 2,
        bookedCount: 0,
        hospital: {
          id: "h1",
          nameAr: "مستشفى القاهرة",
          nameEn: "Cairo Hospital",
          lat: 30.045,
          lng: 31.236,
        },
      },
    ];

    const ranked = rankSlots(candidates, { lat: 30.0444, lng: 31.2357 }, {
      now,
      locale: "en",
    });

    expect(ranked[0].reason).toContain("from your address");
  });

  it("should trigger reason branches for close hospital (<= 5km), low load, and fallback centroid", () => {
    const now = new Date("2026-09-20T09:00:00Z");

    const candidates: SlotCandidate[] = [
      {
        id: "slot-close-hosp",
        clinicId: "c1",
        doctorId: "d1",
        startsAt: new Date("2026-09-28T09:00:00Z"), // later date so earliness is lower
        endsAt: new Date("2026-09-28T09:15:00Z"),
        capacity: 2,
        bookedCount: 0,
        hospital: {
          id: "h1",
          nameAr: "مستشفى قريب",
          nameEn: "Close Hospital",
          lat: 30.046, // ~2 km from default centroid
          lng: 31.238,
        },
      },
      {
        id: "slot-low-load",
        clinicId: "c2",
        doctorId: "d2",
        startsAt: new Date("2026-09-27T09:00:00Z"),
        endsAt: new Date("2026-09-27T09:15:00Z"),
        capacity: 5,
        bookedCount: 0,
        hospital: {
          id: "h2",
          nameAr: "مستشفى بعيد قليل",
          nameEn: "Moderate Distance",
          lat: 30.150, // ~15 km
          lng: 31.300,
        },
      },
    ];

    // Test with Arabic
    const rankedAr = rankSlots(candidates, {}, { now, locale: "ar" });
    expect(rankedAr.length).toBe(2);
    expect(rankedAr.some((r) => r.reason.includes("أقرب مستشفى") || r.reason.includes("منخفضة"))).toBe(true);

    // Test with English
    const rankedEn = rankSlots(candidates, {}, { now, locale: "en" });
    expect(rankedEn.some((r) => r.reason.includes("Closest hospital") || r.reason.includes("pressure"))).toBe(true);
  });
});
