import { describe, it, expect } from "vitest";
import {
  noShowRisk,
  calculateOverbookAllowance,
} from "@/lib/smart/no-show-risk";

describe("Smart Module: noShowRisk & overbookAllowance", () => {
  it("should calculate baseline zero risk for loyal patient with lead time <= 7 and nearby distance", () => {
    const risk = noShowRisk({
      totalAppointments: 10,
      pastNoShows: 0,
      leadTimeDays: 2,
      isMorningFirstSlot: false,
      distanceKm: 5,
      isFirstTimePatient: false,
    });
    expect(risk).toBe(0.0);
  });

  it("should apply weight 0.5 for 100% past no-show ratio", () => {
    const risk = noShowRisk({
      totalAppointments: 4,
      pastNoShows: 4,
      leadTimeDays: 2,
      isMorningFirstSlot: false,
      distanceKm: 5,
      isFirstTimePatient: false,
    });
    expect(risk).toBe(0.5);
  });

  it("should correctly add components: leadTime > 7 (+0.15), morning slot (+0.05), distance > 25 (+0.10)", () => {
    const risk = noShowRisk({
      totalAppointments: 10,
      pastNoShows: 0,
      leadTimeDays: 10, // +0.15
      isMorningFirstSlot: true, // +0.05
      distanceKm: 35, // +0.10
      isFirstTimePatient: false,
    });
    // Expected: 0.15 + 0.05 + 0.10 = 0.30
    expect(risk).toBe(0.3);
  });

  it("should add +0.20 for first-time patient", () => {
    const risk = noShowRisk({
      totalAppointments: 0,
      pastNoShows: 0,
      leadTimeDays: 3,
      isMorningFirstSlot: false,
      distanceKm: 10,
      isFirstTimePatient: true,
    });
    expect(risk).toBe(0.2);
  });

  it("should handle undefined distance and inferred first-time patient", () => {
    const risk = noShowRisk({
      totalAppointments: 0,
      pastNoShows: 0,
      leadTimeDays: 2,
    });
    // totalAppointments === 0 -> isFirstTime = true (+0.20), distance undefined (no extra)
    expect(risk).toBe(0.2);
  });

  it("should clamp maximum risk strictly at 1.0", () => {
    const extremeRisk = noShowRisk({
      totalAppointments: 5,
      pastNoShows: 5, // 0.50
      leadTimeDays: 14, // 0.15
      isMorningFirstSlot: true, // 0.05
      distanceKm: 80, // 0.10
      isFirstTimePatient: true, // 0.20
    });
    // Sum is 1.0
    expect(extremeRisk).toBeLessThanOrEqual(1.0);
    expect(extremeRisk).toBe(1.0);
  });

  it("should correctly compute overbook allowance: floor(capacity * avgRisk) max 2", () => {
    // Capacity 3, Risk 0.8 -> floor(2.4) = 2
    expect(calculateOverbookAllowance(3, 0.8)).toBe(2);

    // Capacity 2, Risk 0.3 -> floor(0.6) = 0
    expect(calculateOverbookAllowance(2, 0.3)).toBe(0);

    // Capacity 5, Risk 0.9 -> floor(4.5) = 4, but capped at max 2
    expect(calculateOverbookAllowance(5, 0.9)).toBe(2);

    // Zero capacity or zero risk
    expect(calculateOverbookAllowance(0, 0.5)).toBe(0);
    expect(calculateOverbookAllowance(3, 0)).toBe(0);
  });
});
