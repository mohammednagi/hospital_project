"use client";

import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  Printer,
  Download,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Building2,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function AppointmentTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.id;

  const t = useTranslations("patient");
  const tCommon = useTranslations("common");
  const tPriority = useTranslations("priorityLanes");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/appointments/${appointmentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTicketData(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load ticket");
        setLoading(false);
      });
  }, [appointmentId]);

  const handleDownloadICS = () => {
    if (!ticketData?.icsContent) return;
    const blob = new Blob([ticketData.icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `appointment-${ticketData.appointment.ticketNo}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav user={null} />
        <main className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm font-medium text-muted-foreground animate-pulse">{tCommon("loading")}</p>
        </main>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav user={null} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-card border border-border text-center max-w-sm">
            <p className="text-sm text-destructive mb-4">{error || "Ticket not found"}</p>
            <Link href="/appointments" className="text-sm text-primary font-bold hover:underline">
              {tCommon("appointments")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { appointment, qrDataUrl } = ticketData;
  const slot = appointment.slot;
  const clinic = slot.clinic;
  const hospital = clinic.hospital;
  const patient = appointment.patient;
  const startDate = new Date(slot.startsAt);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-8">
      <div className="print:hidden">
        <TopNav user={null} />
      </div>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px]"
          >
            <ArrowIcon className="w-4 h-4 rotate-180" />
            <span>{tCommon("appointments")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-border bg-card text-xs font-bold hover:bg-secondary transition-colors cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>{t("printTicket")}</span>
            </button>
            <button
              onClick={handleDownloadICS}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{t("downloadIcs")}</span>
            </button>
          </div>
        </div>

        {/* Physical Boarding Ticket Card */}
        <div className="ticket-card bg-card rounded-3xl border border-border shadow-md overflow-hidden relative print:shadow-none print:border-2 print:border-black">
          {/* Top Notch & Header */}
          <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">
                  {tCommon("ministryName")}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                {t("ticketIssued")}
              </h1>
            </div>

            <div className="text-end">
              <span className="text-[10px] opacity-80 block">{t("ticketNo")}</span>
              <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider tabular-nums">
                {appointment.ticketNo}
              </span>
            </div>
          </div>

          {/* Large Arm's Length Queue Highlight */}
          <div className="p-6 text-center border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              {t("queueNo")}
            </span>
            <div className="text-5xl sm:text-6xl font-extrabold text-primary font-mono tabular-nums tracking-tight">
              #{appointment.queueNo}
            </div>

            {appointment.priorityLane !== "NONE" && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/20 text-accent-foreground border border-accent/30">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>{tPriority(appointment.priorityLane)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Perforation & Cutout Line */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-border" />
            <div className="absolute start-0 -translate-x-1/2 w-5 h-5 rounded-full bg-background border border-border" />
            <div className="absolute end-0 translate-x-1/2 w-5 h-5 rounded-full bg-background border border-border" />
          </div>

          {/* Centered QR Code */}
          <div className="px-6 py-4 flex flex-col items-center justify-center bg-card">
            {qrDataUrl && (
              <div className="p-3 rounded-2xl bg-white border-2 border-primary/20 shadow-xs flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="Boarding Pass QR Code"
                  className="w-36 h-36 object-contain"
                />
                <span className="text-[10px] font-mono text-gray-500 font-bold mt-1">
                  {appointment.id.slice(0, 12)}
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">
              {isRtl ? "امسح الرمز عند شباك الاستقبال لتسجيل الحضور" : "Scan at reception desk for check-in"}
            </p>
          </div>

          {/* Visit Details Grid */}
          <div className="p-6 pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1 font-medium">
                  {tCommon("hospital")}
                </span>
                <span className="font-bold text-foreground block text-sm">
                  {isRtl ? hospital.nameAr : hospital.nameEn}
                </span>
                <span className="text-muted-foreground text-[10px] mt-0.5 block truncate">
                  {hospital.address}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1 font-medium">
                  {tCommon("clinic")}
                </span>
                <span className="font-bold text-foreground block text-sm">
                  {isRtl ? clinic.specialty.nameAr : clinic.specialty.nameEn}
                </span>
                <span className="text-primary font-bold text-[11px] mt-0.5 block">
                  {clinic.roomLabel}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1 font-medium">
                  {tCommon("date")}
                </span>
                <span className="font-bold text-foreground block text-sm">
                  {startDate.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1 font-medium">
                  {tCommon("time")}
                </span>
                <span className="font-bold text-primary block text-sm font-mono tabular-nums">
                  {startDate.toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Citizen Info Strip */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">
                  {isRtl ? patient.fullNameAr : patient.fullNameEn}
                </span>
              </div>
              <div className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                {patient.nationalId}
              </div>
            </div>
          </div>

          {/* Ticket Footer Notes */}
          <div className="p-4 bg-secondary/30 border-t border-border text-center text-[11px] text-muted-foreground leading-relaxed">
            {isRtl
              ? "يرجى التواجد قبل الموعد بـ 15 دقيقة. هذه التذكرة معتمدة من وزارة الصحة والسكان."
              : "Please arrive 15 minutes before your appointment. Certified by MoHP."}
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <MobileBottomBar />
      </div>
    </div>
  );
}
