export interface ParsedNationalId {
  isValid: boolean;
  birthDate?: Date;
  gender?: "MALE" | "FEMALE";
  governorateCode?: string;
  error?: string;
}

// Egyptian civil registry governorate codes
export const EGYPTIAN_GOVERNORATE_CODES: Record<string, { ar: string; en: string }> = {
  "01": { ar: "القاهرة", en: "Cairo" },
  "02": { ar: "الإسكندرية", en: "Alexandria" },
  "03": { ar: "بورسعيد", en: "Port Said" },
  "04": { ar: "السويس", en: "Suez" },
  "11": { ar: "دمياط", en: "Damietta" },
  "12": { ar: "الدقهلية", en: "Dakahlia" },
  "13": { ar: "الشرقية", en: "Ash Sharqia" },
  "14": { ar: "القليوبية", en: "Al Qalyubia" },
  "15": { ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  "16": { ar: "الغربية", en: "Gharbia" },
  "17": { ar: "المنوفية", en: "Monufia" },
  "18": { ar: "البحيرة", en: "Beheira" },
  "19": { ar: "الإسماعيلية", en: "Ismailia" },
  "21": { ar: "الجيزة", en: "Giza" },
  "22": { ar: "بني سويف", en: "Beni Suef" },
  "23": { ar: "الفيوم", en: "Faiyum" },
  "24": { ar: "المنيا", en: "Minya" },
  "25": { ar: "أسيوط", en: "Asyut" },
  "26": { ar: "سوهاج", en: "Sohag" },
  "27": { ar: "قنا", en: "Qena" },
  "28": { ar: "أسوان", en: "Aswan" },
  "29": { ar: "الأقصر", en: "Luxor" },
  "31": { ar: "البحر الأحمر", en: "Red Sea" },
  "32": { ar: "الوادي الجديد", en: "New Valley" },
  "33": { ar: "مطروح", en: "Matrouh" },
  "34": { ar: "شمال سيناء", en: "North Sinai" },
  "35": { ar: "جنوب سيناء", en: "South Sinai" },
  "88": { ar: "مركز أجنبي / وافد", en: "Abroad / Foreign" },
};

export function parseNationalId(id: string): ParsedNationalId {
  if (!id || typeof id !== "string") {
    return { isValid: false, error: "National ID is required" };
  }

  const trimmed = id.trim();

  // Exactly 14 numeric digits
  if (!/^\d{14}$/.test(trimmed)) {
    return { isValid: false, error: "National ID must be exactly 14 digits" };
  }

  // Digit 1: Century (2 for 1900-1999, 3 for 2000-2099)
  const centuryDigit = parseInt(trimmed[0], 10);
  if (centuryDigit !== 2 && centuryDigit !== 3) {
    return { isValid: false, error: "Century digit must be 2 or 3" };
  }

  const centuryBase = centuryDigit === 2 ? 1900 : 2000;
  const yearOffset = parseInt(trimmed.substring(1, 3), 10);
  const birthYear = centuryBase + yearOffset;
  const birthMonth = parseInt(trimmed.substring(3, 5), 10);
  const birthDay = parseInt(trimmed.substring(5, 7), 10);

  if (birthMonth < 1 || birthMonth > 12) {
    return { isValid: false, error: "Invalid birth month" };
  }

  // Days in month validation (accounting for leap year)
  const isLeapYear = (birthYear % 4 === 0 && birthYear % 100 !== 0) || birthYear % 400 === 0;
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (birthDay < 1 || birthDay > daysInMonth[birthMonth - 1]) {
    return { isValid: false, error: "Invalid birth day for month" };
  }

  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const today = new Date();

  if (birthDate > today) {
    return { isValid: false, error: "Birth date cannot be in the future" };
  }

  // Digits 8-9: Governorate Code
  const govCode = trimmed.substring(7, 9);
  if (!EGYPTIAN_GOVERNORATE_CODES[govCode]) {
    return { isValid: false, error: "Unrecognized Egyptian governorate code" };
  }

  // Digit 13: Gender (Odd = Male, Even = Female)
  const genderDigit = parseInt(trimmed[12], 10);
  const gender: "MALE" | "FEMALE" = genderDigit % 2 === 1 ? "MALE" : "FEMALE";

  return {
    isValid: true,
    birthDate,
    gender,
    governorateCode: govCode,
  };
}
