"use client";

import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  Printer,
  Download,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  QrCode,
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
          <p className="text-xs text-muted-foreground animate-pulse">{tCommon("loading")}</p>
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
            <p className="text-xs text-destructive mb-4">{error || "Ticket not found"}</p>
            <Link href="/appointments" className="text-xs text-primary font-bold hover:underline">
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
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <div className="print:hidden">
        <TopNav user={null} />
      </div>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb / Back Action */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowIcon className="w-4 h-4 rotate-180" />
            <span>{tCommon("appointments")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>{t("printTicket")}</span>
            </button>
            <button
              onClick={handleDownloadICS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("downloadIcs")}</span>
            </button>
          </div>
        </div>

        {/* Printable Ticket Card */}
        <div className="bg-card rounded-2xl border-2 border-primary/30 overflow-hidden shadow-lg print:border-black print:shadow-none">
          {/* Ticket Header */}
          <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between print:bg-gray-100 print:text-black">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-[11px] font-bold tracking-wide uppercase">
                  {tCommon("ministryName")}
                </span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight">
                {t("ticketIssued")}
              </h1>
            </div>

            <div className="text-end">
              <span className="text-[10px] opacity-80 block">{t("ticketNo")}</span>
              <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider">
                {appointment.ticketNo}
              </span>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 space-y-6">
            {/* Queue Number Highlight Box */}
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">
                  {t("queueNo")}
                </span>
                <span className="text-4xl font-extrabold text-primary font-mono">
                  #{appointment.queueNo}
                </span>
                {appointment.priorityLane !== "NONE" && (
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {tPriority(appointment.priorityLane)}
                  </span>
                )}
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="p-2 rounded-xl bg-white border border-border shrink-0 shadow-xs">
                  <img
                    src={qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-32 h-32 object-contain"
                  />
                  <span className="text-[9px] text-gray-500 font-mono text-center block mt-1">
                    {appointment.id.slice(0, 10)}
                  </span>
                </div>
              )}
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1">
                  {tCommon("hospital")}
                </span>
                <span className="font-bold text-foreground block">
                  {isRtl ? hospital.nameAr : hospital.nameEn}
                </span>
                <span className="text-muted-foreground text-[10px] mt-0.5 block">
                  {hospital.address}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1">
                  {tCommon("clinic")}
                </span>
                <span className="font-bold text-foreground block">
                  {isRtl ? clinic.specialty.nameAr : clinic.specialty.nameEn}
                </span>
                <span className="text-muted-foreground text-[10px] mt-0.5 block">
                  {clinic.roomLabel}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1">
                  {tCommon("date")}
                </span>
                <span className="font-bold text-foreground block">
                  {startDate.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground block text-[11px] mb-1">
                  {tCommon("time")}
                </span>
                <span className="font-bold text-primary block text-sm font-mono">
                  {startDate.toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Patient Credentials */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">
                  {isRtl ? patient.fullNameAr : patient.fullNameEn}
                </span>
              </div>
              <div className="font-mono text-[11px]">
                {patient.nationalId}
              </div>
            </div>
          </div>

          {/* Ticket Footer Instructions */}
          <div className="p-4 bg-muted/40 border-t border-border text-center text-[11px] text-muted-foreground">
            {isRtl
              ? "يرجى التواجد بالعيادة قبل الموعد بـ 15 دقيقة وإبراز رمز QR عند شباك الاستقبال لتسجيل الحضور."
              : "Please arrive 15 minutes before your slot and present this QR code at the reception desk for check-in."}
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <MobileBottomBar />
      </div>
    </div>
  );
}
