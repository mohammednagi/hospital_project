import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import { redirect } from "next/navigation";
import {
  Calendar,
  Clock,
  Building2,
  Ticket,
  Bell,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CalendarCheck,
  CalendarPlus,
  Sparkles,
} from "lucide-react";

export default async function PatientDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const userId = (session.user as any).id;
  const t = await getTranslations("patient");
  const tCommon = await getTranslations("common");
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // 1. Fetch Next Upcoming Appointment
  const nextAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: userId,
      status: { in: ["BOOKED", "CONFIRMED", "CHECKED_IN"] },
      slot: { startsAt: { gte: new Date() } },
    },
    include: {
      slot: {
        include: {
          clinic: {
            include: {
              hospital: true,
              specialty: true,
            },
          },
          doctor: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { slot: { startsAt: "asc" } },
  });

  // 2. Fetch Last Visited Specialty for Quick Rebook
  const lastAppointment = await prisma.appointment.findFirst({
    where: { patientId: userId },
    include: {
      slot: {
        include: {
          clinic: {
            include: { specialty: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch User Notifications
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-8">
      <TopNav user={session.user as any} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-primary block mb-1">
              {tCommon("portalName")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("dashboardTitle")}{" "}
              <span className="text-primary">
                {isRtl ? (session.user as any).fullNameAr : (session.user as any).fullNameEn}
              </span>
            </h1>
          </div>

          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>{t("bookNew")}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Next Appointment & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Appointment Hero Card */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-foreground">
                    {t("nextAppointment")}
                  </h2>
                </div>
                {nextAppointment && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {nextAppointment.status}
                  </span>
                )}
              </div>

              {nextAppointment ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">
                          {isRtl
                            ? nextAppointment.slot.clinic.specialty.nameAr
                            : nextAppointment.slot.clinic.specialty.nameEn}
                        </span>
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {nextAppointment.slot.clinic.roomLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {isRtl
                            ? nextAppointment.slot.clinic.hospital.nameAr
                            : nextAppointment.slot.clinic.hospital.nameEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-primary pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {nextAppointment.slot.startsAt.toLocaleDateString(
                            isRtl ? "ar-EG" : "en-US",
                            { weekday: "short", month: "short", day: "numeric" }
                          )}
                        </span>
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5" />
                          {nextAppointment.slot.startsAt.toLocaleTimeString(
                            isRtl ? "ar-EG" : "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-end">
                        <span className="text-[11px] text-muted-foreground block font-medium">
                          {t("ticketNo")}
                        </span>
                        <span className="font-mono font-bold text-xs bg-background px-2.5 py-1 rounded-md border border-border text-foreground tabular-nums">
                          {nextAppointment.ticketNo}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-[11px] text-muted-foreground block font-medium">
                          {t("queueNo")}
                        </span>
                        <span className="font-extrabold text-2xl text-primary font-mono tabular-nums">
                          #{nextAppointment.queueNo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                    <Link
                      href={`/appointments/${nextAppointment.id}/ticket`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-accent text-accent-foreground font-bold text-xs hover:bg-accent/90 transition-all cursor-pointer active:scale-95"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{isRtl ? "عرض التذكرة الرسمية ورمز QR" : "View Boarding Pass & QR"}</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href="/appointments"
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer min-h-[44px] inline-flex items-center"
                    >
                      {isRtl ? "إدارة الموعد (تعديل / إلغاء)" : "Manage (Reschedule / Cancel)"}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("noUpcoming")}
                  </p>
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>{t("bookNew")}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Rebook for Last Specialty */}
            {lastAppointment && (
              <div className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">
                      {t("quickBookAgain")}
                    </span>
                    <span className="font-bold text-sm text-foreground">
                      {isRtl
                        ? lastAppointment.slot.clinic.specialty.nameAr
                        : lastAppointment.slot.clinic.specialty.nameEn}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/book/hospital?specialtyCode=${lastAppointment.slot.clinic.specialty.code}`}
                  className="px-4 py-2 min-h-[44px] rounded-full border border-primary/30 text-primary font-bold text-xs hover:bg-primary/10 transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{isRtl ? "حجز الآن" : "Book Now"}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar Column: Notifications Center */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">
                    {tCommon("notifications")}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground font-mono font-bold bg-secondary px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-2.5">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-xl border border-border bg-secondary/30 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {notif.sentAt.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {notif.body}
                      </p>
                      <span className="inline-block text-[9px] uppercase font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                        {notif.channel}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">
                  {isRtl ? "لا توجد إشعارات جديدة حالياً" : "No new notifications"}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomBar />
    </div>
  );
}
