import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/ar/login",
    error: "/ar/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const pathname = nextUrl.pathname;

      // Public paths
      const isPublic =
        pathname === "/" ||
        pathname === "/ar" ||
        pathname === "/en" ||
        pathname.includes("/login") ||
        pathname.includes("/register") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/specialties/suggest") ||
        pathname.startsWith("/_next") ||
        pathname.includes("/favicon.ico");

      if (isPublic) return true;

      // Must be logged in for application areas
      if (!isLoggedIn) return false;

      // Role-based path checks
      if (pathname.includes("/ministry") && role !== "MINISTRY_ADMIN") {
        return false;
      }
      if (pathname.includes("/hospital-admin") && role !== "HOSPITAL_ADMIN") {
        return false;
      }
      if (pathname.includes("/doctor") && role !== "DOCTOR") {
        return false;
      }
      if (
        pathname.includes("/reception") &&
        role !== "RECEPTION" &&
        role !== "HOSPITAL_ADMIN"
      ) {
        return false;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nationalId = (user as any).nationalId;
        token.role = (user as any).role;
        token.fullNameAr = (user as any).fullNameAr;
        token.fullNameEn = (user as any).fullNameEn;
        token.governorateId = (user as any).governorateId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).nationalId = token.nationalId as string;
        (session.user as any).role = token.role as string;
        (session.user as any).fullNameAr = token.fullNameAr as string;
        (session.user as any).fullNameEn = token.fullNameEn as string;
        (session.user as any).governorateId = token.governorateId as string;
      }
      return session;
    },
  },
  providers: [], // Configured in lib/auth.ts with credentials provider
};
