"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { parseNationalId } from "@/lib/smart/national-id";
import { Role } from "@prisma/client";

const registerSchema = z.object({
  nationalId: z.string().length(14, "National ID must be 14 digits"),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, "Egyptian phone number must start with 01 and be 11 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullNameAr: z.string().min(3, "Full Arabic name is required"),
  fullNameEn: z.string().min(3, "Full English name is required"),
  governorateId: z.string().min(1, "Governorate is required"),
  hasDisability: z.boolean().default(false),
  isPregnant: z.boolean().default(false),
  otpCode: z.string().length(6, "OTP must be 6 digits"),
});

export async function registerPatientAction(formData: FormData) {
  const raw = {
    nationalId: formData.get("nationalId") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    fullNameAr: formData.get("fullNameAr") as string,
    fullNameEn: formData.get("fullNameEn") as string,
    governorateId: formData.get("governorateId") as string,
    hasDisability: formData.get("hasDisability") === "true",
    isPregnant: formData.get("isPregnant") === "true",
    otpCode: formData.get("otpCode") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  // Validate National ID
  const nidResult = parseNationalId(data.nationalId);
  if (!nidResult.isValid || !nidResult.birthDate || !nidResult.gender) {
    return { success: false, error: nidResult.error || "Invalid National ID format" };
  }

  // Verify OTP (Demo mode accepts any 6 digits)
  if (!/^\d{6}$/.test(data.otpCode)) {
    return { success: false, error: "OTP code must be 6 numeric digits" };
  }

  // Check existing user
  const existing = await prisma.user.findUnique({
    where: { nationalId: data.nationalId },
  });

  if (existing) {
    return { success: false, error: "A user with this National ID is already registered" };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      nationalId: data.nationalId,
      phone: data.phone,
      passwordHash,
      role: Role.PATIENT,
      fullNameAr: data.fullNameAr,
      fullNameEn: data.fullNameEn,
      birthDate: nidResult.birthDate,
      gender: nidResult.gender,
      governorateId: data.governorateId,
      hasDisability: data.hasDisability,
      isPregnant: data.isPregnant,
      locale: "ar",
    },
  });

  // Log to AuditLog
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "USER_REGISTER",
      entity: "User",
      entityId: user.id,
      meta: {
        nationalId: user.nationalId,
        governorateId: user.governorateId,
        hasDisability: user.hasDisability,
        isPregnant: user.isPregnant,
      },
    },
  });

  return { success: true, userId: user.id };
}
