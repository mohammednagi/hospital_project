import { describe, it, expect } from "vitest";
import { suggestSpecialty, normalizeArabic } from "@/lib/smart/specialty-suggest";

describe("Smart Module: suggestSpecialty", () => {
  it("should correctly normalize Arabic text", () => {
    expect(normalizeArabic("أحمد وإبراهيم")).toBe("احمد وابراهيم");
    expect(normalizeArabic("مستشفى الصَّحَّة")).toBe("مستشفي الصحه");
    expect(normalizeArabic("   عِظام   ")).toBe("عظام");
  });

  it("should route Egyptian colloquial symptom 'وجع بطن' to Internal Medicine (INT)", () => {
    const results = suggestSpecialty("عندي وجع بطن ومغص شديد", "ar");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].code).toBe("INT");
    expect(results[0].confidence).toBeGreaterThan(0.3);
  });

  it("should route Egyptian colloquial symptom 'سخونية' with fever expansion to PED or INT or GP", () => {
    const results = suggestSpecialty("سخونية شديدة وحرارة", "ar");
    expect(results.length).toBeGreaterThan(0);
    const codes = results.map((r) => r.code);
    expect(codes.some((c) => ["PED", "INT", "GP"].includes(c))).toBe(true);
  });

  it("should route chest pain and palpitations to Cardiology (CARD)", () => {
    const results = suggestSpecialty("أشعر بألم في الصدر وخفقان ونهجان", "ar");
    expect(results[0].code).toBe("CARD");
  });

  it("should route vision blur and eye redness to Ophthalmology (OPHTH)", () => {
    const results = suggestSpecialty("عندي زغللة في العين واحمرار وضعف نظر", "ar");
    expect(results[0].code).toBe("OPHTH");
  });

  it("should support English queries accurately", () => {
    const results = suggestSpecialty("severe chest pain and palpitations", "en");
    expect(results[0].code).toBe("CARD");

    const skinResults = suggestSpecialty("skin rash with itching and acne", "en");
    expect(skinResults[0].code).toBe("DERM");
  });

  it("should gracefully fallback to General Practice (GP) on ambiguous or empty input", () => {
    const emptyResults = suggestSpecialty("", "ar");
    expect(emptyResults[0].code).toBe("GP");

    const gibberishResults = suggestSpecialty("xyz random unrelated query 12345", "ar");
    expect(gibberishResults[0].code).toBe("GP");
    expect(gibberishResults[0].confidence).toBe(0.2);
  });

  it("should return at most 3 ranked results", () => {
    const results = suggestSpecialty("صداع وتعب ومغص ووجع ظهر وحكة", "ar");
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("should handle whitespace-only input and custom specialty lists", () => {
    const ws = suggestSpecialty("   ", "ar");
    expect(ws[0].code).toBe("GP");

    // Custom specialty without GP
    const custom = [
      {
        code: "CARD",
        nameAr: "قلب",
        nameEn: "Cardiology",
        keywordsAr: ["قلب"],
        keywordsEn: ["heart"],
      },
    ];
    const noMatch = suggestSpecialty("صداع عيون", "ar", custom);
    expect(noMatch[0].code).toBe("CARD");
  });
});
