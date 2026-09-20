import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  nationalId: z.string().length(14, "National ID must be 14 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "National ID",
      credentials: {
        nationalId: { label: "National ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { nationalId, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { nationalId },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          nationalId: user.nationalId,
          name: user.fullNameAr,
          role: user.role,
          fullNameAr: user.fullNameAr,
          fullNameEn: user.fullNameEn,
          governorateId: user.governorateId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || "smartgov-hospital-secret-key-egypt-universal-health-insurance-2026",
});
