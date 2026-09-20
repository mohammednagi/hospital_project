"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  Calendar,
  Clock,
  Building2,
  Ticket,
  AlertTriangle,
  RotateCcw,
  XCircle,
  CalendarPlus,
  Sparkles,
} from "lucide-react";

export default function AppointmentsPage() {
  const t = useTranslations("patient");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [tab, setTab] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = () => {
    setLoading(true);
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (data.appointments) setAppointments(data.appointments);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const now = new Date();
  const upcoming = appointments.filter((a) => {
    const slotDate = new Date(a.slot.startsAt);
    return (
      slotDate >= now &&
      ["BOOKED", "CONFIRMED", "CHECKED_IN"].includes(a.status)
    );
  });

  const past = appointments.filter((a) => {
    const slotDate = new Date(a.slot.startsAt);
    return (
      slotDate < now || ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(a.status)
    );
  });

  const handleCancel = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCancelModalId(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const currentList = tab === "UPCOMING" ? upcoming : past;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
      case "CONFIRMED":
        return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
      case "CHECKED_IN":
        return "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "NO_SHOW":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "CANCELLED":
        return "bg-secondary text-muted-foreground border-border";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-8">
      <TopNav user={null} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {tCommon("appointments")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRtl ? "متابعة وإدارة كشوفاتك في المستشفيات الحكومية" : "Track and manage your public clinic appointments"}
            </p>
          </div>

          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>{t("bookNew")}</span>
          </Link>
        </div>

        {/* Segmented Control Tabs */}
        <div className="inline-flex p-1 rounded-full bg-secondary border border-border">
          <button
            onClick={() => setTab("UPCOMING")}
            className={`px-5 py-2 min-h-[40px] rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              tab === "UPCOMING"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isRtl ? "المواعيد القادمة" : "Upcoming"} ({upcoming.length})
          </button>
          <button
            onClick={() => setTab("PAST")}
            className={`px-5 py-2 min-h-[40px] rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              tab === "PAST"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isRtl ? "السابقة والملغاة" : "Past & Cancelled"} ({past.length})
          </button>
        </div>

        {/* List of Appointments */}
        {loading ? (
          <div className="py-16 text-center text-sm font-medium text-muted-foreground animate-pulse">
            {tCommon("loading")}
          </div>
        ) : currentList.length > 0 ? (
          <div className="space-y-3">
            {currentList.map((appt) => {
              const startDate = new Date(appt.slot.startsAt);
              const clinic = appt.slot.clinic;
              const hospital = clinic.hospital;
              const isUpcoming = tab === "UPCOMING";

              return (
                <div
                  key={appt.id}
                  className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(appt.status)}`}>
                        {tStatus(appt.status)}
                      </span>
                      <span className="font-mono text-xs font-bold text-primary tabular-nums">
                        {appt.ticketNo}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">
                        ({t("queueNo")}: #{appt.queueNo})
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground">
                      {isRtl ? clinic.specialty.nameAr : clinic.specialty.nameEn}
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md ms-2">
                        {clinic.roomLabel}
                      </span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {isRtl ? hospital.nameAr : hospital.nameEn}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {startDate.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-primary font-bold tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        {startDate.toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {appt.outcomeNote && (
                      <p className="text-xs text-muted-foreground bg-secondary/40 p-3 rounded-xl mt-2 border border-border">
                        <span className="font-bold text-foreground block mb-0.5">
                          {isRtl ? "توجيهات وتشخيص الطبيب:" : "Doctor Outcome Note:"}
                        </span>
                        {appt.outcomeNote}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    <Link
                      href={`/appointments/${appt.id}/ticket`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-border bg-card text-xs font-bold hover:bg-secondary transition-all cursor-pointer active:scale-95"
                    >
                      <Ticket className="w-4 h-4 text-primary" />
                      <span>{t("printTicket")} / QR</span>
                    </Link>

                    {isUpcoming && (
                      <>
                        <Link
                          href={`/book/slot?hospitalId=${hospital.id}&specialtyCode=${clinic.specialty.code}&clinicId=${clinic.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-border text-xs font-bold hover:bg-secondary transition-all cursor-pointer active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t("reschedule")}</span>
                        </Link>

                        <button
                          onClick={() => setCancelModalId(appt.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t("cancelAppointment")}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-card border border-border text-center text-sm text-muted-foreground">
            {tab === "UPCOMING" ? t("noUpcoming") : (isRtl ? "لا توجد مواعيد سابقة مسجلة." : "No past appointments found.")}
          </div>
        )}

        {/* Destructive Action Modal */}
        {cancelModalId && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card rounded-3xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-base text-foreground mb-1">
                  {t("cancelAppointment")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("cancelConfirm")}
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalId(null)}
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 min-h-[44px] rounded-full border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary transition-all cursor-pointer active:scale-95"
                >
                  {tCommon("back")}
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(cancelModalId)}
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 min-h-[44px] rounded-full bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all cursor-pointer active:scale-95"
                >
                  {actionLoading ? tCommon("loading") : (isRtl ? "تأكيد الإلغاء" : "Yes, Cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MobileBottomBar />
    </div>
  );
}
