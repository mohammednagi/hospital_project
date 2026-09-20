import { describe, it, expect } from "vitest";
import { parseNationalId } from "@/lib/smart/national-id";

describe("Smart Module: parseNationalId", () => {
  it("should successfully parse a valid 20th-century male ID (Cairo)", () => {
    // Century: 2 (19xx), Year: 95 (1995), Month: 01, Day: 01, Gov: 01 (Cairo), Seq: 012, Gen: 1 (Male), Check: 4
    const id = "29501010101234";
    const result = parseNationalId(id);

    expect(result.isValid).toBe(true);
    expect(result.gender).toBe("MALE");
    expect(result.governorateCode).toBe("01");
    expect(result.birthDate).toBeInstanceOf(Date);
    expect(result.birthDate?.getFullYear()).toBe(1995);
    expect(result.birthDate?.getMonth()).toBe(0); // January
    expect(result.birthDate?.getDate()).toBe(1);
  });

  it("should successfully parse a valid 21st-century female ID (Giza)", () => {
    // Century: 3 (20xx), Year: 04 (2004), Month: 06, Day: 15, Gov: 21 (Giza), Seq: 015, Gen: 2 (Female), Check: 8
    const id = "30406152101528";
    const result = parseNationalId(id);

    expect(result.isValid).toBe(true);
    expect(result.gender).toBe("FEMALE");
    expect(result.governorateCode).toBe("21");
    expect(result.birthDate?.getFullYear()).toBe(2004);
    expect(result.birthDate?.getMonth()).toBe(5); // June
    expect(result.birthDate?.getDate()).toBe(15);
  });

  it("should correctly handle leap year birthdays (Feb 29)", () => {
    // Year 2000 was a leap year
    const id = "30002290101234";
    const result = parseNationalId(id);
    expect(result.isValid).toBe(true);
    expect(result.birthDate?.getMonth()).toBe(1); // February
    expect(result.birthDate?.getDate()).toBe(29);
  });

  it("should reject non-leap year Feb 29", () => {
    // Year 1999 was NOT a leap year
    const id = "29902290101234";
    const result = parseNationalId(id);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Invalid birth day");
  });

  it("should reject invalid length or non-numeric characters", () => {
    expect(parseNationalId("").isValid).toBe(false);
    expect(parseNationalId("2950101010123").isValid).toBe(false); // 13 digits
    expect(parseNationalId("295010101012345").isValid).toBe(false); // 15 digits
    expect(parseNationalId("2950101010123A").isValid).toBe(false); // Alpha
    expect(parseNationalId(null as any).isValid).toBe(false);
  });

  it("should reject invalid century digit", () => {
    const id = "19501010101234"; // Century 1 is invalid
    const result = parseNationalId(id);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Century digit must be 2 or 3");

    const id4 = "49501010101234"; // Century 4 is invalid
    expect(parseNationalId(id4).isValid).toBe(false);
  });

  it("should reject invalid month (> 12 or 00)", () => {
    expect(parseNationalId("29513010101234").isValid).toBe(false); // Month 13
    expect(parseNationalId("29500010101234").isValid).toBe(false); // Month 00
  });

  it("should reject invalid days (> 31 or 00 or 31 in 30-day month)", () => {
    expect(parseNationalId("29504310101234").isValid).toBe(false); // April has 30 days
    expect(parseNationalId("29501000101234").isValid).toBe(false); // Day 00
    expect(parseNationalId("29501320101234").isValid).toBe(false); // Day 32
  });

  it("should reject unknown Egyptian governorate codes", () => {
    // Governorate code 99 does not exist in Egypt
    const id = "29501019901234";
    const result = parseNationalId(id);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Unrecognized Egyptian governorate code");
  });

  it("should reject future birth dates", () => {
    // 2099 is in the future
    const id = "39901010101234";
    const result = parseNationalId(id);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("cannot be in the future");
  });
});
