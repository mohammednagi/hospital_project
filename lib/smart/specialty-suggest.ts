export interface SpecialtySuggestion {
  code: string;
  nameAr: string;
  nameEn: string;
  confidence: number;
  matchedKeywords: string[];
}

export interface SpecialtyDefinition {
  code: string;
  nameAr: string;
  nameEn: string;
  keywordsAr: string[];
  keywordsEn: string[];
}

export const DEFAULT_SPECIALTIES: SpecialtyDefinition[] = [
  {
    code: "GP",
    nameAr: "طب عام",
    nameEn: "General Practice",
    keywordsAr: ["عام", "كشف عام", "فحص", "تعب", "إرهاق", "صداع خفيف", "ضعف", "حرارة خفيفة", "دوخة"],
    keywordsEn: ["general", "routine", "checkup", "fatigue", "weakness", "mild headache", "dizziness"],
  },
  {
    code: "INT",
    nameAr: "باطنة",
    nameEn: "Internal Medicine",
    keywordsAr: ["باطنة", "ضغط", "سكر", "وجع بطن", "مغص", "عسر هضم", "قولون", "حموضة", "كبد", "كلى", "غثيان", "إسهال", "إمساك", "انتفاخ"],
    keywordsEn: ["internal", "hypertension", "blood pressure", "diabetes", "stomach ache", "colon", "acidity", "liver", "nausea", "diarrhea"],
  },
  {
    code: "CARD",
    nameAr: "قلب وأوعية دموية",
    nameEn: "Cardiology",
    keywordsAr: ["قلب", "وجع صدر", "خفقان", "ضربات قلب", "نهجان", "ضيق تنفس", "شرايين", "ألم في الصدر", "ذبحة", "ضغط مرتفع"],
    keywordsEn: ["heart", "cardio", "chest pain", "palpitations", "shortness of breath", "breathlessness", "angina"],
  },
  {
    code: "ORTHO",
    nameAr: "عظام",
    nameEn: "Orthopedics",
    keywordsAr: ["عظام", "كسر", "وجع ظهر", "مفاصل", "خشونة ركبة", "غضروف", "التواء", "فقرات", "رقبة", "كتف", "روماتيزم"],
    keywordsEn: ["bones", "ortho", "fracture", "back pain", "joint pain", "knee", "spine", "shoulder", "arthritis"],
  },
  {
    code: "PED",
    nameAr: "أطفال",
    nameEn: "Pediatrics",
    keywordsAr: ["أطفال", "سخونية طفل", "ترجيع طفل", "تطعيمات", "نمو", "مغص رضع", "كحة طفل", "طفل", "رضيع", "حرارة طفل"],
    keywordsEn: ["pediatric", "child", "infant", "child fever", "vaccination", "baby colic", "baby"],
  },
  {
    code: "OPHTH",
    nameAr: "رمد وجراحة عيون",
    nameEn: "Ophthalmology",
    keywordsAr: ["عيون", "رمد", "زغللة", "احمرار عين", "ضعف نظر", "مياه بيضاء", "جفاف عين", "نظارة", "قرنية", "حرقان في العين"],
    keywordsEn: ["eyes", "vision", "blur", "red eye", "cataract", "dry eyes", "glasses", "cornea"],
  },
  {
    code: "ENT",
    nameAr: "أنف وأذن وحنجرة",
    nameEn: "ENT",
    keywordsAr: ["أنف", "أذن", "حنجرة", "احتقان زور", "التهاب لوز", "طنين أذن", "جيوب أنفية", "فقدان شم", "بحة صوت", "بلغم", "كحة ناشفة"],
    keywordsEn: ["ent", "ear", "nose", "throat", "sore throat", "tonsils", "sinus", "tinnitus", "hoarseness"],
  },
  {
    code: "OBGYN",
    nameAr: "نساء وتوليد",
    nameEn: "Obstetrics & Gynecology",
    keywordsAr: ["نساء", "توليد", "حمل", "ولادة", "متابعة حمل", "سونار", "دورة شهرية", "تأخر إنجاب", "نزيف مهبلي", "إفرازات"],
    keywordsEn: ["gynecology", "obstetrics", "pregnancy", "prenatal", "ultrasound", "maternity", "menstrual"],
  },
  {
    code: "DERM",
    nameAr: "جلدية",
    nameEn: "Dermatology",
    keywordsAr: ["جلدية", "حكة", "طفح جلدي", "حب شباب", "تساقط شعر", "صدفية", "إكزيما", "حساسية جلد", "هرش", "بقع حمراء"],
    keywordsEn: ["dermatology", "skin", "rash", "itching", "acne", "hair fall", "eczema", "psoriasis"],
  },
  {
    code: "SURG",
    nameAr: "جراحة عامة",
    nameEn: "General Surgery",
    keywordsAr: ["جراحة", "فتق", "مرارة", "زائدة دودية", "خراج", "بواسير", "ناسور", "استئصال", "ورم", "نزيف جراحي"],
    keywordsEn: ["surgery", "hernia", "gallbladder", "appendix", "abscess", "hemorrhoids", "lump"],
  },
];

/**
 * Normalize Arabic text: remove diacritics, unify alef forms, normalize taa marbouta / yaa
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();
}

/**
 * Pure rule-based symptom router.
 * Evaluates free text against keyword maps and returns top 3 matching specialties
 * with confidence and a guaranteed fallback to General Practice.
 * STRICTLY FOR ROUTING - NEVER GIVES MEDICAL ADVICE.
 */
export function suggestSpecialty(
  freeText: string,
  locale: "ar" | "en" = "ar",
  specialties: SpecialtyDefinition[] = DEFAULT_SPECIALTIES
): SpecialtySuggestion[] {
  if (!freeText || typeof freeText !== "string" || !freeText.trim()) {
    const gp = specialties.find((s) => s.code === "GP") || specialties[0];
    return [
      {
        code: gp.code,
        nameAr: gp.nameAr,
        nameEn: gp.nameEn,
        confidence: 0.1,
        matchedKeywords: [],
      },
    ];
  }

  const normalizedInput = locale === "ar" ? normalizeArabic(freeText) : freeText.toLowerCase().trim();

  // Egyptian colloquial mapping expansions
  const colloquialExpansions: Record<string, string[]> = {
    "سخونية": ["حرارة", "سخونة", "حمى"],
    "وجع بطن": ["مغص", "عسر هضم", "قولون"],
    "صداع": ["دوخة", "زغللة", "شقيقة"],
    "كحة": ["بلغم", "ضيق تنفس", "احتقان"],
    "هرش": ["حكة", "طفح جلدي", "حساسية"],
  };

  let augmentedText = normalizedInput;
  for (const [colloquial, targets] of Object.entries(colloquialExpansions)) {
    const normColloquial = normalizeArabic(colloquial);
    if (normalizedInput.includes(normColloquial)) {
      augmentedText += " " + targets.map(normalizeArabic).join(" ");
    }
  }

  const results: SpecialtySuggestion[] = [];

  for (const spec of specialties) {
    const keywords = locale === "ar" ? spec.keywordsAr : spec.keywordsEn;
    const matched: string[] = [];

    for (const kw of keywords) {
      const normKw = locale === "ar" ? normalizeArabic(kw) : kw.toLowerCase().trim();
      if (augmentedText.includes(normKw)) {
        matched.push(kw);
      }
    }

    if (matched.length > 0) {
      // Calculate confidence bounded between 0.2 and 0.95
      const score = Math.min(0.95, 0.35 + matched.length * 0.2);
      results.push({
        code: spec.code,
        nameAr: spec.nameAr,
        nameEn: spec.nameEn,
        confidence: Number(score.toFixed(2)),
        matchedKeywords: matched,
      });
    }
  }

  // Sort descending by confidence and matched count
  results.sort((a, b) => b.confidence - a.confidence || b.matchedKeywords.length - a.matchedKeywords.length);

  // If nothing matched or confidence is low, include fallback GP
  if (results.length === 0) {
    const gp = specialties.find((s) => s.code === "GP") || specialties[0];
    results.push({
      code: gp.code,
      nameAr: gp.nameAr,
      nameEn: gp.nameEn,
      confidence: 0.2,
      matchedKeywords: [locale === "ar" ? "توجيه عام (طب عام)" : "General Practice fallback"],
    });
  }

  return results.slice(0, 3);
}
