"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageToggle } from "./language-toggle";
import { Building2, Calendar, User, Stethoscope, ClipboardList, ShieldAlert, BarChart3, LogIn } from "lucide-react";

interface TopNavProps {
  user?: {
    id: string;
    role: string;
    fullNameAr: string;
    fullNameEn: string;
  } | null;
}

export function TopNav({ user }: TopNavProps) {
  const t = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const pathname = usePathname();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "PATIENT":
        return { label: tRoles("PATIENT"), bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "RECEPTION":
        return { label: tRoles("RECEPTION"), bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "DOCTOR":
        return { label: tRoles("DOCTOR"), bg: "bg-purple-100 text-purple-800 border-purple-200" };
      case "HOSPITAL_ADMIN":
        return { label: tRoles("HOSPITAL_ADMIN"), bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "MINISTRY_ADMIN":
        return { label: tRoles("MINISTRY_ADMIN"), bg: "bg-rose-100 text-rose-800 border-rose-200" };
      default:
        return { label: role, bg: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full chrome-translucent border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Portal Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-foreground">
                {t("appName")}
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-medium bg-accent/15 text-accent-foreground rounded-full border border-accent/30">
                {t("uhisBadge")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {t("ministryName")}
            </span>
          </div>
        </Link>

        {/* Navigation Links based on role */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
            }`}
          >
            {t("home")}
          </Link>

          {user && user.role === "PATIENT" && (
            <>
              <Link
                href="/book"
                className={`px-3 py-2 rounded-lg transition-colors hover:text-primary flex items-center gap-1.5 ${
                  pathname.includes("/book") ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{t("book")}</span>
              </Link>
              <Link
                href="/appointments"
                className={`px-3 py-2 rounded-lg transition-colors hover:text-primary flex items-center gap-1.5 ${
                  pathname.includes("/appointments") ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t("appointments")}</span>
              </Link>
            </>
          )}

          {user && (user.role === "RECEPTION" || user.role === "HOSPITAL_ADMIN") && (
            <Link
              href="/reception/board"
              className={`px-3 py-2 rounded-lg transition-colors hover:text-primary flex items-center gap-1.5 ${
                pathname.includes("/reception") ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{tRoles("RECEPTION")}</span>
            </Link>
          )}

          {user && user.role === "DOCTOR" && (
            <Link
              href="/doctor/queue"
              className={`px-3 py-2 rounded-lg transition-colors hover:text-primary flex items-center gap-1.5 ${
                pathname.includes("/doctor") ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>{tRoles("DOCTOR")}</span>
            </Link>
          )}

          {user && user.role === "HOSPITAL_ADMIN" && (
            <Link
              href="/hospital-admin/clinics"
              className={`px-3 py-2 rounded-lg transition-colors hover:text-primary flex items-center gap-1.5 ${
                pathname.includes("/hospital-admin") ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{tRoles("HOSPITAL_ADMIN")}</span>
            </Link>
          )}

          {user && user.role === "MINISTRY_ADMIN" && (
            <Link
              href="/ministry/dashboard"
              className={`px-3 py-2 rounded-lg transition-colors hover:text-primary flex items-center gap-1.5 ${
                pathname.includes("/ministry") ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{tRoles("MINISTRY_ADMIN")}</span>
            </Link>
          )}
        </nav>

        {/* User Profile / Auth Action & Language Switcher */}
        <div className="flex items-center gap-2.5">
          <LanguageToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(user.role).bg}`}>
                {getRoleBadge(user.role).label}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[120px] truncate">
                  {locale === "ar" ? user.fullNameAr : user.fullNameEn}
                </span>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t("login")}</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary transition-colors"
              >
                <span>{t("register")}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
