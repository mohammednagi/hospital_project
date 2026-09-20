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
  MapPin,
  Building2,
  Ticket,
  Bell,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  CalendarCheck,
  CalendarPlus,
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
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <TopNav user={session.user as any} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-primary block mb-1">
              {tCommon("portalName")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("dashboardTitle")}{" "}
              <span className="text-primary">
                {isRtl ? (session.user as any).fullNameAr : (session.user as any).fullNameEn}
              </span>
            </h1>
          </div>

          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>{t("bookNew")}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Next Appointment & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Appointment Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    {t("nextAppointment")}
                  </h2>
                </div>
                {nextAppointment && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {nextAppointment.status}
                  </span>
                )}
              </div>

              {nextAppointment ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">
                          {isRtl
                            ? nextAppointment.slot.clinic.specialty.nameAr
                            : nextAppointment.slot.clinic.specialty.nameEn}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({nextAppointment.slot.clinic.roomLabel})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
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
                        <span className="flex items-center gap-1">
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
                        <span className="text-[11px] text-muted-foreground block">
                          {t("ticketNo")}
                        </span>
                        <span className="font-mono font-bold text-xs bg-background px-2 py-0.5 rounded border border-border text-foreground">
                          {nextAppointment.ticketNo}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-[11px] text-muted-foreground block">
                          {t("queueNo")}
                        </span>
                        <span className="font-bold text-sm text-primary">
                          #{nextAppointment.queueNo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Link
                      href={`/appointments/${nextAppointment.id}/ticket`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{isRtl ? "عرض تفاصيل التذكرة ورمز QR" : "View Ticket & QR Code"}</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href="/appointments"
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {isRtl ? "إدارة الموعد (تعديل / إلغاء)" : "Manage (Reschedule / Cancel)"}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {t("noUpcoming")}
                  </p>
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>{t("bookNew")}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Rebook for Last Specialty */}
            {lastAppointment && (
              <div className="p-5 rounded-2xl border border-border bg-gradient-to-r from-secondary/50 via-background to-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">
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
                  className="px-3.5 py-2 rounded-xl border border-primary/30 text-primary font-bold text-xs hover:bg-primary/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{isRtl ? "حجز الآن" : "Book Now"}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar Column: Notifications Center */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    {tCommon("notifications")}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {notifications.length}
                </span>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl border border-border bg-muted/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {notif.sentAt.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {notif.body}
                      </p>
                      <span className="inline-block text-[9px] uppercase font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                        {notif.channel}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">
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
