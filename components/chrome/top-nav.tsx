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
        return { label: tRoles("PATIENT"), bg: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" };
      case "RECEPTION":
        return { label: tRoles("RECEPTION"), bg: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60" };
      case "DOCTOR":
        return { label: tRoles("DOCTOR"), bg: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60" };
      case "HOSPITAL_ADMIN":
        return { label: tRoles("HOSPITAL_ADMIN"), bg: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" };
      case "MINISTRY_ADMIN":
        return { label: tRoles("MINISTRY_ADMIN"), bg: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60" };
      default:
        return { label: role, bg: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full chrome-translucent shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Portal Name */}
        <Link href="/" className="flex items-center gap-3 group min-h-[44px]">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-foreground">
                {t("appName")}
              </span>
              <span className="hidden md:inline-flex px-2.5 py-0.5 text-[11px] font-semibold bg-accent/15 text-accent-foreground rounded-full border border-accent/30">
                {t("uhisBadge")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {t("ministryName")}
            </span>
          </div>
        </Link>

        {/* Navigation Links based on role */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          <Link
            href="/"
            className={`px-3.5 py-2 min-h-[44px] inline-flex items-center rounded-full transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
            }`}
          >
            {t("home")}
          </Link>

          {user && user.role === "PATIENT" && (
            <>
              <Link
                href="/book"
                className={`px-3.5 py-2 min-h-[44px] rounded-full transition-colors hover:text-primary inline-flex items-center gap-2 ${
                  pathname.includes("/book") ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{t("book")}</span>
              </Link>
              <Link
                href="/appointments"
                className={`px-3.5 py-2 min-h-[44px] rounded-full transition-colors hover:text-primary inline-flex items-center gap-2 ${
                  pathname.includes("/appointments") ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
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
              className={`px-3.5 py-2 min-h-[44px] rounded-full transition-colors hover:text-primary inline-flex items-center gap-2 ${
                pathname.includes("/reception") ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{tRoles("RECEPTION")}</span>
            </Link>
          )}

          {user && user.role === "DOCTOR" && (
            <Link
              href="/doctor/queue"
              className={`px-3.5 py-2 min-h-[44px] rounded-full transition-colors hover:text-primary inline-flex items-center gap-2 ${
                pathname.includes("/doctor") ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>{tRoles("DOCTOR")}</span>
            </Link>
          )}

          {user && user.role === "HOSPITAL_ADMIN" && (
            <Link
              href="/hospital-admin/clinics"
              className={`px-3.5 py-2 min-h-[44px] rounded-full transition-colors hover:text-primary inline-flex items-center gap-2 ${
                pathname.includes("/hospital-admin") ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{tRoles("HOSPITAL_ADMIN")}</span>
            </Link>
          )}

          {user && user.role === "MINISTRY_ADMIN" && (
            <Link
              href="/ministry/dashboard"
              className={`px-3.5 py-2 min-h-[44px] rounded-full transition-colors hover:text-primary inline-flex items-center gap-2 ${
                pathname.includes("/ministry") ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
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
              <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(user.role).bg}`}>
                {getRoleBadge(user.role).label}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full bg-secondary text-xs font-semibold text-foreground">
                <User className="w-4 h-4 text-primary" />
                <span className="max-w-[120px] truncate">
                  {locale === "ar" ? user.fullNameAr : user.fullNameEn}
                </span>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-3 py-1.5 min-h-[44px] rounded-full border border-border text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer active:scale-95"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t("login")}</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center px-4 py-2 min-h-[44px] rounded-full border border-border text-xs font-semibold hover:bg-secondary transition-colors active:scale-95"
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
