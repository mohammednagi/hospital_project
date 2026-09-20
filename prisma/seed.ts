import {
  PrismaClient,
  Role,
  Gender,
  HospitalType,
  AppointmentStatus,
  BookingSource,
  PriorityLane,
  WaitlistStatus,
  NotificationChannel,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GOVERNORATES = [
  { code: "01", nameAr: "القاهرة", nameEn: "Cairo", lat: 30.0444, lng: 31.2357 },
  { code: "02", nameAr: "الإسكندرية", nameEn: "Alexandria", lat: 31.2001, lng: 29.9187 },
  { code: "03", nameAr: "بورسعيد", nameEn: "Port Said", lat: 31.2653, lng: 32.3019 },
  { code: "04", nameAr: "السويس", nameEn: "Suez", lat: 29.9668, lng: 32.5498 },
  { code: "11", nameAr: "دمياط", nameEn: "Damietta", lat: 31.4175, lng: 31.8144 },
  { code: "12", nameAr: "الدقهلية", nameEn: "Dakahlia", lat: 31.0409, lng: 31.3785 },
  { code: "13", nameAr: "الشرقية", nameEn: "Ash Sharqia", lat: 30.5765, lng: 31.5041 },
  { code: "14", nameAr: "القليوبية", nameEn: "Al Qalyubia", lat: 30.2864, lng: 31.2089 },
  { code: "15", nameAr: "كفر الشيخ", nameEn: "Kafr El Sheikh", lat: 31.1107, lng: 30.9388 },
  { code: "16", nameAr: "الغربية", nameEn: "Gharbia", lat: 30.7865, lng: 31.0004 },
  { code: "17", nameAr: "المنوفية", nameEn: "Monufia", lat: 30.5972, lng: 30.9876 },
  { code: "18", nameAr: "البحيرة", nameEn: "Beheira", lat: 31.0364, lng: 30.4699 },
  { code: "19", nameAr: "الإسماعيلية", nameEn: "Ismailia", lat: 30.5965, lng: 32.2715 },
  { code: "21", nameAr: "الجيزة", nameEn: "Giza", lat: 30.0131, lng: 31.2089 },
  { code: "22", nameAr: "بني سويف", nameEn: "Beni Suef", lat: 29.0661, lng: 31.0994 },
  { code: "23", nameAr: "الفيوم", nameEn: "Faiyum", lat: 29.3084, lng: 30.8428 },
  { code: "24", nameAr: "المنيا", nameEn: "Minya", lat: 28.0871, lng: 30.7618 },
  { code: "25", nameAr: "أسيوط", nameEn: "Asyut", lat: 27.1809, lng: 31.1837 },
  { code: "26", nameAr: "سوهاج", nameEn: "Sohag", lat: 26.5590, lng: 31.6957 },
  { code: "27", nameAr: "قنا", nameEn: "Qena", lat: 26.1551, lng: 32.7160 },
  { code: "28", nameAr: "أسوان", nameEn: "Aswan", lat: 24.0889, lng: 32.8998 },
  { code: "29", nameAr: "الأقصر", nameEn: "Luxor", lat: 25.6872, lng: 32.6396 },
  { code: "31", nameAr: "البحر الأحمر", nameEn: "Red Sea", lat: 27.2579, lng: 33.8116 },
  { code: "32", nameAr: "الوادي الجديد", nameEn: "New Valley", lat: 25.4514, lng: 30.5472 },
  { code: "33", nameAr: "مطروح", nameEn: "Matrouh", lat: 31.3543, lng: 27.2373 },
  { code: "34", nameAr: "شمال سيناء", nameEn: "North Sinai", lat: 31.1299, lng: 33.8016 },
  { code: "35", nameAr: "جنوب سيناء", nameEn: "South Sinai", lat: 28.9712, lng: 34.0204 },
];

const SPECIALTIES = [
  {
    code: "GP",
    nameAr: "طب عام",
    nameEn: "General Practice",
    keywordsAr: ["عام", "كشف عام", "فحص دوري", "تعب", "إرهاق", "صداع خفيف", "ضعف"],
    keywordsEn: ["general", "routine", "checkup", "fatigue", "weakness", "mild headache"],
  },
  {
    code: "INT",
    nameAr: "باطنة",
    nameEn: "Internal Medicine",
    keywordsAr: ["باطنة", "ضغط", "سكر", "وجع بطن", "مغص", "عسر هضم", "قولون", "حموضة", "كبد", "كلى", "غثيان"],
    keywordsEn: ["internal", "hypertension", "blood pressure", "diabetes", "stomach pain", "colon", "acidity", "liver"],
  },
  {
    code: "CARD",
    nameAr: "قلب وأوعية دموية",
    nameEn: "Cardiology",
    keywordsAr: ["قلب", "وجع صدر", "خفقان", "ضربات قلب", "نهجان", "ضيق تنفس", "شرايين", "ألم في الصدر"],
    keywordsEn: ["heart", "cardio", "chest pain", "palpitations", "breathlessness", "angina"],
  },
  {
    code: "ORTHO",
    nameAr: "عظام",
    nameEn: "Orthopedics",
    keywordsAr: ["عظام", "كسر", "وجع ظهر", "مفاصل", "خشونة ركبة", "غضروف", "التواء", "فقرات", "رقبة"],
    keywordsEn: ["bones", "ortho", "fracture", "back pain", "joint pain", "knee", "spine"],
  },
  {
    code: "PED",
    nameAr: "أطفال",
    nameEn: "Pediatrics",
    keywordsAr: ["أطفال", "سخونية طفل", "ترجيع طفل", "تطعيمات", "نمو", "مغص رضع", "كحة طفل", "نزلات معوية"],
    keywordsEn: ["pediatric", "child", "infant", "child fever", "vaccination", "baby colic"],
  },
  {
    code: "OPHTH",
    nameAr: "رمد وجراحة عيون",
    nameEn: "Ophthalmology",
    keywordsAr: ["عيون", "رمد", "زغللة", "احمرار عين", "ضعف نظر", "مياه بيضاء", "جفاف عين", "نظارة", "قرنية"],
    keywordsEn: ["eyes", "vision", "blur", "red eye", "cataract", "dry eyes", "glasses"],
  },
  {
    code: "ENT",
    nameAr: "أنف وأذن وحنجرة",
    nameEn: "ENT",
    keywordsAr: ["أنف", "أذن", "حنجرة", "احتقان زور", "التهاب لوز", "طنين أذن", "جيوب أنفية", "فقدان شم", "بحة صوت"],
    keywordsEn: ["ent", "ear", "nose", "throat", "sore throat", "tonsils", "sinus", "tinnitus"],
  },
  {
    code: "OBGYN",
    nameAr: "نساء وتوليد",
    nameEn: "Obstetrics & Gynecology",
    keywordsAr: ["نساء", "توليد", "حمل", "ولادة", "متابعة حمل", "سونار", "دورة شهرية", "تأخر إنجاب"],
    keywordsEn: ["gynecology", "obstetrics", "pregnancy", "prenatal", "ultrasound", "maternity"],
  },
  {
    code: "DERM",
    nameAr: "جلدية",
    nameEn: "Dermatology",
    keywordsAr: ["جلدية", "حكة", "طفح جلدي", "حب شباب", "تساقط شعر", "صدفية", "إكزيما", "حساسية جلد"],
    keywordsEn: ["dermatology", "skin", "rash", "itching", "acne", "hair fall", "eczema", "psoriasis"],
  },
  {
    code: "SURG",
    nameAr: "جراحة عامة",
    nameEn: "General Surgery",
    keywordsAr: ["جراحة", "فتق", "مرارة", "زائدة دودية", "خراج", "بواسير", "ناسور", "استئصال"],
    keywordsEn: ["surgery", "hernia", "gallbladder", "appendix", "abscess", "hemorrhoids"],
  },
];

async function main() {
  console.log("Starting SmartGov Hospital seed script...");
  const rawPassword = process.env.SEED_DEFAULT_PASSWORD || "GovEgypt@2026";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 1. Seed Governorates
  console.log("Seeding 27 Governorates...");
  const govMap = new Map<string, string>();
  for (const g of GOVERNORATES) {
    const gov = await prisma.governorate.upsert({
      where: { code: g.code },
      update: { nameAr: g.nameAr, nameEn: g.nameEn, lat: g.lat, lng: g.lng },
      create: g,
    });
    govMap.set(g.code, gov.id);
  }

  // 2. Seed Specialties
  console.log("Seeding 10 Specialties...");
  const specMap = new Map<string, string>();
  for (const s of SPECIALTIES) {
    const spec = await prisma.specialty.upsert({
      where: { code: s.code },
      update: {
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        keywordsAr: s.keywordsAr,
        keywordsEn: s.keywordsEn,
      },
      create: s,
    });
    specMap.set(s.code, spec.id);
  }

  // 3. Seed 12 Hospitals
  console.log("Seeding 12 Hospitals across Cairo, Giza, Qalyubia, Alexandria, and Assiut...");
  const hospitalsData = [
    // Cairo (01)
    {
      code: "01",
      nameAr: "مستشفى قصر العيني التعليمي الجديد",
      nameEn: "Kasr Al Aini New Educational Hospital",
      type: HospitalType.UNIVERSITY,
      address: "ش قصر العيني، المنيل، القاهرة",
      lat: 30.0305,
      lng: 31.2285,
      phone: "02-23654000",
    },
    {
      code: "01",
      nameAr: "مستشفى أحمد ماهر التعليمي",
      nameEn: "Ahmed Maher Teaching Hospital",
      type: HospitalType.SPECIALIZED,
      address: "ش بورسعيد، السيدة زينب، القاهرة",
      lat: 30.0392,
      lng: 31.2467,
      phone: "02-23912111",
    },
    {
      code: "01",
      nameAr: "مستشفى المنيرة العام",
      nameEn: "Al Mounira General Hospital",
      type: HospitalType.GENERAL,
      address: "ش نوبار، السيدة زينب، القاهرة",
      lat: 30.0354,
      lng: 31.2401,
      phone: "02-23644025",
    },
    {
      code: "01",
      nameAr: "مستشفى معهد ناصر للبحوث والعلاج",
      nameEn: "Nasser Institute Hospital",
      type: HospitalType.SPECIALIZED,
      address: "كورنيش النيل، الساحل، القاهرة",
      lat: 30.0894,
      lng: 31.2389,
      phone: "02-24300300",
    },
    // Giza (21)
    {
      code: "21",
      nameAr: "مستشفى إمبابة المركزي",
      nameEn: "Imbaba Central Hospital",
      type: HospitalType.CENTRAL,
      address: "شارع المحطة، إمبابة، الجيزة",
      lat: 30.0712,
      lng: 31.2134,
      phone: "02-33124567",
    },
    {
      code: "21",
      nameAr: "مستشفى أم المصريين العام",
      nameEn: "Umm Al-Masryeen General Hospital",
      type: HospitalType.GENERAL,
      address: "ش البحر الأعظم، الجيزة",
      lat: 29.9981,
      lng: 31.2120,
      phone: "02-35728890",
    },
    {
      code: "21",
      nameAr: "مستشفى 6 أكتوبر المركزي",
      nameEn: "6th of October Central Hospital",
      type: HospitalType.CENTRAL,
      address: "الحي السادس، مدينة 6 أكتوبر، الجيزة",
      lat: 29.9654,
      lng: 30.9321,
      phone: "02-38350123",
    },
    // Qalyubia (14)
    {
      code: "14",
      nameAr: "مستشفى بنها الجامعي",
      nameEn: "Banha University Hospital",
      type: HospitalType.UNIVERSITY,
      address: "ميدان سعد زغلول، بنها، القليوبية",
      lat: 30.4667,
      lng: 31.1833,
      phone: "013-3224567",
    },
    {
      code: "14",
      nameAr: "مستشفى قليوب التخصصي",
      nameEn: "Qalyub Specialized Hospital",
      type: HospitalType.SPECIALIZED,
      address: "طريق مصر إسكندرية الزراعي، قليوب",
      lat: 30.1802,
      lng: 31.2054,
      phone: "013-2150987",
    },
    // Alexandria (02)
    {
      code: "02",
      nameAr: "المستشفى الجامعي الرئيسي بالإسكندرية",
      nameEn: "Alexandria Main University Hospital",
      type: HospitalType.UNIVERSITY,
      address: "ش شامبليون، الأزاريطة، الإسكندرية",
      lat: 31.2056,
      lng: 29.9142,
      phone: "03-4865432",
    },
    {
      code: "02",
      nameAr: "مستشفى رأس التين العام",
      nameEn: "Ras El Tin General Hospital",
      type: HospitalType.GENERAL,
      address: "الأنفوشي، بحري، الإسكندرية",
      lat: 31.2134,
      lng: 29.8789,
      phone: "03-4809988",
    },
    // Assiut (25)
    {
      code: "25",
      nameAr: "مستشفى جامعة أسيوط الرئيسي",
      nameEn: "Assiut University Main Hospital",
      type: HospitalType.UNIVERSITY,
      address: "الحرم الجامعي، غرب البلد، أسيوط",
      lat: 27.1856,
      lng: 31.1712,
      phone: "088-2413000",
    },
  ];

  const hospitalIds: string[] = [];
  for (const h of hospitalsData) {
    const govId = govMap.get(h.code)!;
    const existing = await prisma.hospital.findFirst({
      where: { nameAr: h.nameAr, governorateId: govId },
    });
    const hospital = existing
      ? await prisma.hospital.update({
          where: { id: existing.id },
          data: {
            nameEn: h.nameEn,
            type: h.type,
            address: h.address,
            lat: h.lat,
            lng: h.lng,
            phone: h.phone,
          },
        })
      : await prisma.hospital.create({
          data: {
            governorateId: govId,
            nameAr: h.nameAr,
            nameEn: h.nameEn,
            type: h.type,
            address: h.address,
            lat: h.lat,
            lng: h.lng,
            phone: h.phone,
          },
        });
    hospitalIds.push(hospital.id);
  }

  // 4. Seed Clinics (Specialties per Hospital)
  console.log("Setting up clinics for hospitals...");
  const clinicIds: string[] = [];
  const specCodes = Array.from(specMap.keys());

  for (let i = 0; i < hospitalIds.length; i++) {
    const hospId = hospitalIds[i];
    // Each hospital has between 5 to 8 specialties
    const numSpecs = 6;
    for (let sIdx = 0; sIdx < numSpecs; sIdx++) {
      const code = specCodes[(i + sIdx) % specCodes.length];
      const specId = specMap.get(code)!;
      const room = `عيادة ${sIdx + 1}0${i + 1}`;
      const clinic = await prisma.clinic.upsert({
        where: {
          hospitalId_specialtyId_roomLabel: {
            hospitalId: hospId,
            specialtyId: specId,
            roomLabel: room,
          },
        },
        update: {},
        create: {
          hospitalId: hospId,
          specialtyId: specId,
          roomLabel: room,
        },
      });
      clinicIds.push(clinic.id);
    }
  }

  // 5. Seed Core Role Demo Users
  console.log("Seeding core role demo users...");
  const cairoGovId = govMap.get("01")!;

  const demoAccounts = [
    {
      nationalId: "29501010101234",
      phone: "01012345678",
      fullNameAr: "أحمد محمود حسن",
      fullNameEn: "Ahmed Mahmoud Hassan",
      role: Role.PATIENT,
      birthDate: new Date("1995-01-01"),
      gender: Gender.MALE,
      governorateId: cairoGovId,
      hasDisability: false,
      isPregnant: false,
    },
    {
      nationalId: "28805050105678",
      phone: "01123456789",
      fullNameAr: "سارة محمد إبراهيم (استقبال)",
      fullNameEn: "Sara Mohamed Ibrahim (Reception)",
      role: Role.RECEPTION,
      birthDate: new Date("1988-05-05"),
      gender: Gender.FEMALE,
      governorateId: cairoGovId,
      hasDisability: false,
      isPregnant: false,
    },
    {
      nationalId: "28003030109012",
      phone: "01234567890",
      fullNameAr: "د. طارق عبد العزيز",
      fullNameEn: "Dr. Tarek Abdel Aziz",
      role: Role.DOCTOR,
      birthDate: new Date("1980-03-03"),
      gender: Gender.MALE,
      governorateId: cairoGovId,
      hasDisability: false,
      isPregnant: false,
    },
    {
      nationalId: "27511110103456",
      phone: "01098765432",
      fullNameAr: "م. خالد مصطفى (مدير المستشفى)",
      fullNameEn: "Eng. Khaled Mostafa (Hospital Admin)",
      role: Role.HOSPITAL_ADMIN,
      birthDate: new Date("1975-11-11"),
      gender: Gender.MALE,
      governorateId: cairoGovId,
      hasDisability: false,
      isPregnant: false,
    },
    {
      nationalId: "27008080107890",
      phone: "01555555555",
      fullNameAr: "د. منى الشريف (مشرف الوزارة)",
      fullNameEn: "Dr. Mona El-Sherif (Ministry Admin)",
      role: Role.MINISTRY_ADMIN,
      birthDate: new Date("1970-08-08"),
      gender: Gender.FEMALE,
      governorateId: cairoGovId,
      hasDisability: false,
      isPregnant: false,
    },
  ];

  for (const acc of demoAccounts) {
    await prisma.user.upsert({
      where: { nationalId: acc.nationalId },
      update: {
        passwordHash,
        role: acc.role,
        fullNameAr: acc.fullNameAr,
        fullNameEn: acc.fullNameEn,
      },
      create: {
        ...acc,
        passwordHash,
      },
    });
  }

  // 6. Seed 24 Doctors with Schedule Templates
  console.log("Seeding 24 doctors with clinics and schedule templates...");
  const doctorIds: string[] = [];
  const doctorNames = [
    { ar: "د. هاني شاكر", en: "Dr. Hani Shaker", title: "استشاري أول", gen: Gender.MALE },
    { ar: "د. نادية الجندي", en: "Dr. Nadia El-Gendy", title: "أخصائي باطنة", gen: Gender.FEMALE },
    { ar: "د. كريم عبد العزيز", en: "Dr. Karim Abdel Aziz", title: "استشاري جراحة", gen: Gender.MALE },
    { ar: "د. منى زكي", en: "Dr. Mona Zaki", title: "أخصائية أطفال", gen: Gender.FEMALE },
    { ar: "د. شريف منير", en: "Dr. Sherif Mounir", title: "استشاري عظام", gen: Gender.MALE },
    { ar: "د. ياسمين صبري", en: "Dr. Yasmine Sabri", title: "أخصائية جلدية", gen: Gender.FEMALE },
    { ar: "د. محمود حميدة", en: "Dr. Mahmoud Hemeida", title: "استشاري قلب", gen: Gender.MALE },
    { ar: "د. هند صبري", en: "Dr. Hend Sabri", title: "استشارية نساء وتوليد", gen: Gender.FEMALE },
    { ar: "د. أحمد حلمي", en: "Dr. Ahmed Helmy", title: "أخصائي عيون", gen: Gender.MALE },
    { ar: "د. رانيا يوسف", en: "Dr. Rania Youssef", title: "أخصائية أنف وأذن", gen: Gender.FEMALE },
    { ar: "د. عمرو يوسف", en: "Dr. Amr Youssef", title: "استشاري باطنة وسكر", gen: Gender.MALE },
    { ar: "د. نيللي كريم", en: "Dr. Nelly Karim", title: "استشارية جراحة عامة", gen: Gender.FEMALE },
    { ar: "د. ماجد الكدواني", en: "Dr. Maged El Kedwany", title: "استشاري أطفال ورضع", gen: Gender.MALE },
    { ar: "د. درة زروق", en: "Dr. Dorra Zarrouk", title: "أخصائية رمد", gen: Gender.FEMALE },
    { ar: "د. إياد نصار", en: "Dr. Eyad Nassar", title: "استشاري عظام ومفاصل", gen: Gender.MALE },
    { ar: "د. أمينة خليل", en: "Dr. Amina Khalil", title: "أخصائية نساء وتوليد", gen: Gender.FEMALE },
    { ar: "د. آسر ياسين", en: "Dr. Asser Yassin", title: "استشاري قلب وقسطرة", gen: Gender.MALE },
    { ar: "د. غادة عادل", en: "Dr. Ghada Adel", title: "أخصائية جلدية وتجميل", gen: Gender.FEMALE },
    { ar: "د. فتحي عبد الوهاب", en: "Dr. Fathy Abdel Wahab", title: "استشاري جراحة", gen: Gender.MALE },
    { ar: "د. صبا مبارك", en: "Dr. Saba Mubarak", title: "أخصائية باطنة", gen: Gender.FEMALE },
    { ar: "د. محمد ممدوح", en: "Dr. Mohamed Mamdouh", title: "أخصائي أنف وأذن", gen: Gender.MALE },
    { ar: "د. دينا الشربيني", en: "Dr. Dina El Sherbiny", title: "أخصائية أطفال", gen: Gender.FEMALE },
    { ar: "د. باسم سمرة", en: "Dr. Bassem Samra", title: "استشاري عظام", gen: Gender.MALE },
    { ar: "د. حنان مطاوع", en: "Dr. Hanan Metaweh", title: "استشارية طب أسرة", gen: Gender.FEMALE },
  ];

  for (let d = 0; d < 24; d++) {
    const docInfo = doctorNames[d];
    const nid = `285${String(d + 1).padStart(2, "0")}15010${String(d + 10).padStart(3, "0")}${docInfo.gen === Gender.MALE ? "1" : "2"}`;
    const user = await prisma.user.upsert({
      where: { nationalId: nid },
      update: {},
      create: {
        nationalId: nid,
        phone: `010203040${String(d).padStart(2, "0")}`,
        fullNameAr: docInfo.ar,
        fullNameEn: docInfo.en,
        passwordHash,
        role: Role.DOCTOR,
        birthDate: new Date(1980 + (d % 10), (d % 12), 15),
        gender: docInfo.gen,
        governorateId: cairoGovId,
      },
    });

    const clinicId = clinicIds[d % clinicIds.length];
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: { clinicId },
      create: {
        userId: user.id,
        clinicId,
        title: docInfo.title,
        licenseNo: `EGY-MOHP-${20000 + d}`,
      },
    });
    doctorIds.push(doctor.id);

    // Seed Schedule Templates: Sat(6) to Thu(4), e.g. 09:00 - 13:00, 15-min slots, cap 2
    for (let day = 0; day <= 6; day++) {
      if (day === 5) continue; // Friday off
      await prisma.scheduleTemplate.upsert({
        where: {
          doctorId_weekday_startTime: {
            doctorId: doctor.id,
            weekday: day,
            startTime: "09:00",
          },
        },
        update: {},
        create: {
          doctorId: doctor.id,
          weekday: day,
          startTime: "09:00",
          endTime: "13:00",
          slotMinutes: 15,
          capacityPerSlot: 2,
        },
      });
    }
  }

  // Also assign our core demo doctor (28003030109012)
  const coreDocUser = await prisma.user.findUnique({ where: { nationalId: "28003030109012" } });
  if (coreDocUser) {
    const coreDoc = await prisma.doctor.upsert({
      where: { userId: coreDocUser.id },
      update: { clinicId: clinicIds[0] },
      create: {
        userId: coreDocUser.id,
        clinicId: clinicIds[0],
        title: "استشاري أول باطنة وقلب",
        licenseNo: "EGY-MOHP-10001",
      },
    });
    for (let day = 0; day <= 6; day++) {
      if (day === 5) continue;
      await prisma.scheduleTemplate.upsert({
        where: {
          doctorId_weekday_startTime: {
            doctorId: coreDoc.id,
            weekday: day,
            startTime: "09:00",
          },
        },
        update: {},
        create: {
          doctorId: coreDoc.id,
          weekday: day,
          startTime: "09:00",
          endTime: "14:00",
          slotMinutes: 15,
          capacityPerSlot: 2,
        },
      });
    }
  }

  // 7. Seed 60 Patients with Diverse Demographics
  console.log("Seeding 60 patients with varied demographics...");
  const patientIds: string[] = [];
  const firstNamesM = ["محمد", "علي", "محمود", "إبراهيم", "يوسف", "كريم", "خالد", "عمر", "طارق", "سامح"];
  const firstNamesF = ["فاطمة", "مريم", "آية", "سارة", "نورهان", "سلمى", "هدى", "رنا", "أميرة", "ياسمين"];
  const lastNames = ["حسن", "سيد", "علي", "فتحي", "عبد الرحمن", "الشربيني", "صلاح", "الشناوي", "عبد ربه", "غانم"];

  for (let p = 0; p < 60; p++) {
    const isFemale = p % 2 === 1;
    const isElderly = p >= 45; // 15 patients age >= 60
    const hasDisability = p % 8 === 0;
    const isPregnant = isFemale && p % 5 === 0 && !isElderly;

    const birthYear = isElderly ? 1950 + (p % 12) : 1970 + (p % 30);
    const century = birthYear >= 2000 ? "3" : "2";
    const yy = String(birthYear % 100).padStart(2, "0");
    const mm = String((p % 12) + 1).padStart(2, "0");
    const dd = String((p % 28) + 1).padStart(2, "0");
    const govCode = GOVERNORATES[p % GOVERNORATES.length].code;
    const genderDigit = isFemale ? "2" : "1";
    const nid = `${century}${yy}${mm}${dd}${govCode}012${genderDigit}`;

    const fn = isFemale ? firstNamesF[p % firstNamesF.length] : firstNamesM[p % firstNamesM.length];
    const ln = lastNames[p % lastNames.length];
    const fullNameAr = `${fn} ${ln}`;
    const fullNameEn = `Patient ${p + 1}`;

    const patUser = await prisma.user.upsert({
      where: { nationalId: nid },
      update: {
        hasDisability,
        isPregnant,
      },
      create: {
        nationalId: nid,
        phone: `0109000${String(p).padStart(4, "0")}`,
        fullNameAr,
        fullNameEn,
        passwordHash,
        role: Role.PATIENT,
        birthDate: new Date(birthYear, Number(mm) - 1, Number(dd)),
        gender: isFemale ? Gender.FEMALE : Gender.MALE,
        governorateId: govMap.get(govCode) || cairoGovId,
        hasDisability,
        isPregnant,
      },
    });
    patientIds.push(patUser.id);
  }

  // 8. Generate Slots (Past 30 days + Next 14 days)
  console.log("Generating slots and appointments (Past 30 days + Next 14 days)...");
  const now = new Date();
  const slotsCreated: { id: string; clinicId: string; startsAt: Date; capacity: number }[] = [];

  // Generate for the first 8 clinics across past 30 days and future 14 days
  const activeClinics = await prisma.clinic.findMany({
    take: 8,
    include: { doctors: true },
  });

  for (const clinic of activeClinics) {
    if (clinic.doctors.length === 0) continue;
    const doc = clinic.doctors[0];

    // Days from -30 to +14
    for (let dayOffset = -30; dayOffset <= 14; dayOffset++) {
      const slotDate = new Date(now);
      slotDate.setDate(slotDate.getDate() + dayOffset);
      const weekday = slotDate.getDay();
      if (weekday === 5) continue; // Friday

      // Create 4 slots per active day (09:00, 09:15, 09:30, 09:45)
      for (let s = 0; s < 4; s++) {
        const startsAt = new Date(slotDate);
        startsAt.setHours(9, s * 15, 0, 0);
        const endsAt = new Date(startsAt);
        endsAt.setMinutes(endsAt.getMinutes() + 15);

        const slot = await prisma.slot.create({
          data: {
            clinicId: clinic.id,
            doctorId: doc.id,
            startsAt,
            endsAt,
            capacity: 2,
            bookedCount: 0,
            overbookAllowance: 1,
          },
        });
        slotsCreated.push({
          id: slot.id,
          clinicId: clinic.id,
          startsAt,
          capacity: slot.capacity,
        });
      }
    }
  }

  console.log(`Generated ${slotsCreated.length} slots.`);

  // 9. Seed 300 Appointments
  console.log("Seeding 300 appointments...");
  const appointmentStatuses: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.BOOKED,
  ];

  let apptIndex = 0;
  for (let i = 0; i < 300 && i < slotsCreated.length; i++) {
    const slot = slotsCreated[i];
    const patientId = patientIds[i % patientIds.length];
    const isPast = slot.startsAt < now;
    const isToday =
      slot.startsAt.toDateString() === now.toDateString();

    let status: AppointmentStatus;
    if (isPast && !isToday) {
      status = i % 5 === 0 ? AppointmentStatus.NO_SHOW : AppointmentStatus.COMPLETED;
    } else if (isToday) {
      status = i % 3 === 0 ? AppointmentStatus.CHECKED_IN : AppointmentStatus.BOOKED;
    } else {
      status = AppointmentStatus.BOOKED;
    }

    const lane: PriorityLane =
      i % 10 === 0
        ? PriorityLane.DISABILITY
        : i % 7 === 0
        ? PriorityLane.PREGNANCY
        : i % 5 === 0
        ? PriorityLane.ELDERLY
        : PriorityLane.NONE;

    const ticketNo = `TKT-${slot.startsAt.getFullYear()}${String(slot.startsAt.getMonth() + 1).padStart(2, "0")}-${String(1000 + i)}`;

    await prisma.appointment.create({
      data: {
        patientId,
        slotId: slot.id,
        status,
        ticketNo,
        queueNo: (i % 20) + 1,
        source: i % 4 === 0 ? BookingSource.RECEPTION : BookingSource.WEB,
        priorityLane: lane,
        noShowRiskScore: status === AppointmentStatus.NO_SHOW ? 0.75 : 0.15,
        outcomeNote:
          status === AppointmentStatus.COMPLETED
            ? "تم الكشف والفحص وصرف العلاج اللازم مع التوصية بالمتابعة."
            : null,
        checkedInAt:
          status === AppointmentStatus.CHECKED_IN || status === AppointmentStatus.COMPLETED
            ? new Date(slot.startsAt.getTime() - 10 * 60 * 1000)
            : null,
        completedAt:
          status === AppointmentStatus.COMPLETED
            ? new Date(slot.startsAt.getTime() + 12 * 60 * 1000)
            : null,
      },
    });

    // Update slot booked count
    await prisma.slot.update({
      where: { id: slot.id },
      data: { bookedCount: { increment: 1 } },
    });

    apptIndex++;
  }

  // 10. Seed 15 Waitlist Entries
  console.log("Seeding 15 waitlist entries...");
  for (let w = 0; w < 15; w++) {
    const clinicId = clinicIds[w % clinicIds.length];
    const patientId = patientIds[(w + 10) % patientIds.length];
    const preferredDate = new Date(now);
    preferredDate.setDate(preferredDate.getDate() + (w % 5) + 1);

    await prisma.waitlistEntry.create({
      data: {
        patientId,
        clinicId,
        preferredDate,
        status: WaitlistStatus.WAITING,
      },
    });
  }

  // 11. Seed Initial AuditLog & Notifications
  console.log("Seeding sample notifications and audit logs...");
  const primaryPatient = await prisma.user.findUnique({ where: { nationalId: "29501010101234" } });
  if (primaryPatient) {
    await prisma.notification.create({
      data: {
        userId: primaryPatient.id,
        channel: NotificationChannel.SMS_MOCK,
        title: "تأكيد حجز موعد عيادة",
        body: "تم تأكيد حجز موعدكم في مستشفى قصر العيني - عيادة الباطنة. رقم التذكرة TKT-2026-1001.",
      },
    });

    await prisma.notification.create({
      data: {
        userId: primaryPatient.id,
        channel: NotificationChannel.INAPP,
        title: "تذكير بالموعد",
        body: "يرجى الحضور قبل الموعد بـ 15 دقيقة وإبراز بطاقة الرقم القومي عند شباك الاستقبال.",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "SYSTEM_SEEDED",
      entity: "Database",
      entityId: "initial_seed",
      meta: { timestamp: new Date().toISOString(), version: "1.0.0" },
    },
  });

  console.log("\n========================================================");
  console.log("       SMARTGOV HOSPITAL SEED COMPLETE!                ");
  console.log("========================================================");
  console.log("Demo Credentials (Password: " + rawPassword + "):");
  console.log("1. PATIENT:        29501010101234 (أحمد محمود حسن)");
  console.log("2. RECEPTION:      28805050105678 (سارة محمد إبراهيم)");
  console.log("3. DOCTOR:         28003030109012 (د. طارق عبد العزيز)");
  console.log("4. HOSPITAL_ADMIN: 27511110103456 (م. خالد مصطفى)");
  console.log("5. MINISTRY_ADMIN: 27008080107890 (د. منى الشريف)");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
