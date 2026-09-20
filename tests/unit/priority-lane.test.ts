import { describe, it, expect } from "vitest";
import {
  computePriorityLane,
  calculateAge,
  getPriorityLaneRank,
} from "@/lib/smart/priority-lane";

describe("Smart Module: computePriorityLane", () => {
  const refDate = new Date("2026-09-20");

  it("should accurately calculate age from birthdate", () => {
    expect(calculateAge(new Date("1995-01-01"), refDate)).toBe(31);
    expect(calculateAge(new Date("1960-09-19"), refDate)).toBe(66);
    expect(calculateAge(new Date("1960-09-25"), refDate)).toBe(65);
    expect(calculateAge("2000-05-15", refDate)).toBe(26);
  });

  it("should assign DISABILITY priority when citizen has disability", () => {
    const lane = computePriorityLane(
      {
        birthDate: new Date("1990-01-01"),
        hasDisability: true,
        isPregnant: false,
      },
      refDate
    );
    expect(lane).toBe("DISABILITY");
  });

  it("should assign PREGNANCY priority for pregnant citizens without disability", () => {
    const lane = computePriorityLane(
      {
        birthDate: new Date("1995-03-10"),
        hasDisability: false,
        isPregnant: true,
      },
      refDate
    );
    expect(lane).toBe("PREGNANCY");
  });

  it("should assign ELDERLY priority for citizens aged 60 and above", () => {
    const lane = computePriorityLane(
      {
        birthDate: new Date("1965-01-01"), // Age 61 in 2026
        hasDisability: false,
        isPregnant: false,
      },
      refDate
    );
    expect(lane).toBe("ELDERLY");
  });

  it("should assign NONE for non-elderly, non-pregnant citizens without disability", () => {
    const lane = computePriorityLane(
      {
        birthDate: new Date("1995-01-01"), // Age 31
        hasDisability: false,
        isPregnant: false,
      },
      refDate
    );
    expect(lane).toBe("NONE");
  });

  it("should correctly rank priority lanes for queue ordering", () => {
    expect(getPriorityLaneRank("DISABILITY")).toBeGreaterThan(getPriorityLaneRank("PREGNANCY"));
    expect(getPriorityLaneRank("PREGNANCY")).toBeGreaterThan(getPriorityLaneRank("ELDERLY"));
    expect(getPriorityLaneRank("ELDERLY")).toBeGreaterThan(getPriorityLaneRank("NONE"));
  });
});
