"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import {
  ClipboardList,
  Search,
  UserCheck,
  UserPlus,
  Building2,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

export default function ReceptionBoardPage() {
  const t = useTranslations("reception");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [boardData, setBoardData] = useState<any>({
    booked: [],
    checkedIn: [],
    inProgress: [],
    completedOrNoShow: [],
  });
  const [loading, setLoading] = useState(true);

  // Quick Check-in Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Walk-in Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInNationalId, setWalkInNationalId] = useState("");
  const [walkInNameAr, setWalkInNameAr] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInDisability, setWalkInDisability] = useState(false);
  const [walkInPregnant, setWalkInPregnant] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  // Load clinics
  useEffect(() => {
    fetch("/api/specialties")
      .then((res) => res.json())
      .then((data) => {
        if (data.specialties) {
          // Fetch hospitals with clinics
          fetch("/api/hospitals")
            .then((res) => res.json())
            .then((hData) => {
              if (hData.hospitals && hData.hospitals.length > 0) {
                const allClinics: any[] = [];
                hData.hospitals.forEach((h: any) => {
                  h.clinics?.forEach((c: any) => {
                    allClinics.push({
                      id: c.id,
                      roomLabel: c.roomLabel,
                      hospitalNameAr: h.nameAr,
                      hospitalNameEn: h.nameEn,
                      specialtyNameAr: c.specialty?.nameAr,
                      specialtyNameEn: c.specialty?.nameEn,
                    });
                  });
                });
                setClinics(allClinics);
                if (allClinics.length > 0 && !selectedClinicId) {
                  setSelectedClinicId(allClinics[0].id);
                }
              }
            });
        }
      });
  }, []);

  // Fetch board data when clinic changes
  const fetchBoard = () => {
    setLoading(true);
    let url = "/api/reception/board";
    if (selectedClinicId) url += `?clinicId=${selectedClinicId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.board) setBoardData(data.board);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBoard();
  }, [selectedClinicId]);

  // Quick Check-in
  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setToastMessage(null);

    try {
      const res = await fetch("/api/reception/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToastMessage({
          text: data.error || (locale === "ar" ? "لم يتم العثور على حجز اليوم" : "Booking not found"),
          type: "error",
        });
      } else {
        setToastMessage({
          text: locale === "ar" ? `تم تسجيل الحضور بنجاح! رقم الدخول #${data.appointment.queueNo}` : `Checked in successfully! Queue #${data.appointment.queueNo}`,
          type: "success",
        });
        setSearchQuery("");
        fetchBoard();
      }
    } catch (err: any) {
      setToastMessage({ text: err.message || "Error checking in", type: "error" });
    } finally {
      setSearchLoading(false);
    }
  };

  // Walk-In Booking
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInSubmitting(true);
    setToastMessage(null);

    try {
      const res = await fetch("/api/reception/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: selectedClinicId || clinics[0]?.id,
          nationalId: walkInNationalId,
          fullNameAr: walkInNameAr,
          phone: walkInPhone,
          hasDisability: walkInDisability,
          isPregnant: walkInPregnant,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ text: data.error || "Walk-in booking failed", type: "error" });
      } else {
        setToastMessage({
          text: locale === "ar" ? `تم حجز الكشف الفوري بنجاح! تذكرة رقم ${data.appointment.ticketNo}` : `Walk-in booked! Ticket ${data.appointment.ticketNo}`,
          type: "success",
        });
        setShowWalkInModal(false);
        setWalkInNationalId("");
        setWalkInNameAr("");
        setWalkInPhone("");
        fetchBoard();
      }
    } catch (err: any) {
      setToastMessage({ text: err.message || "Walk-in error", type: "error" });
    } finally {
      setWalkInSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav user={{ id: "reception", role: "RECEPTION", fullNameAr: "سارة محمد", fullNameEn: "Sara Mohamed" }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header and Clinic Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {tRoles("RECEPTION")}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("boardTitle")}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRtl ? "متابعة تدفق طابور المرضى وتسجيل الحضور والحجز المباشر بالعيادة" : "Real-time clinic board, check-ins, and walk-in admissions"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Clinic Switcher */}
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-input bg-card text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {isRtl ? c.specialtyNameAr : c.specialtyNameEn} - {isRtl ? c.hospitalNameAr : c.hospitalNameEn} ({c.roomLabel})
                </option>
              ))}
            </select>

            {/* Walk-in Button */}
            <button
              onClick={() => setShowWalkInModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("walkInBtn")}</span>
            </button>
          </div>
        </div>

        {/* Quick Check-in Search Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute start-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("scanTicket")}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{searchLoading ? tCommon("loading") : t("checkInBtn")}</span>
            </button>
          </form>

          {toastMessage && (
            <div
              className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
                toastMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              <span>{toastMessage.text}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Kanban Board Columns */}
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
            {tCommon("loading")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* 1. BOOKED / CONFIRMED Column */}
            <div className="bg-muted/30 rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>{isRtl ? "محجوز (في الانتظار للوصول)" : "Booked / Arriving"}</span>
                </span>
                <span className="text-[11px] font-mono font-bold bg-card px-2 py-0.5 rounded border border-border">
                  {boardData.booked.length}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                {boardData.booked.map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {isRtl ? appt.patient.fullNameAr : appt.patient.fullNameEn}
                      </span>
                      <span className="font-mono text-primary font-bold">
                        #{appt.queueNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono">{appt.ticketNo}</span>
                      <span>
                        {new Date(appt.slot.startsAt).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {appt.priorityLane !== "NONE" && (
                      <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {appt.priorityLane}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSearchQuery(appt.ticketNo);
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg border border-primary/30 text-primary font-semibold text-[11px] hover:bg-primary/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t("checkInBtn")}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. CHECKED_IN Column */}
            <div className="bg-muted/30 rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span>{isRtl ? "حاضر بالعيادة (طابور الطبيب)" : "Checked In (Waiting)"}</span>
                </span>
                <span className="text-[11px] font-mono font-bold bg-card px-2 py-0.5 rounded border border-border">
                  {boardData.checkedIn.length}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                {boardData.checkedIn.map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-xl border-2 border-teal-500/30 bg-card shadow-xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {isRtl ? appt.patient.fullNameAr : appt.patient.fullNameEn}
                      </span>
                      <span className="font-mono text-teal-700 font-extrabold text-sm">
                        #{appt.queueNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono">{appt.ticketNo}</span>
                      <span className="text-teal-700 font-medium">
                        {isRtl ? "في صالة الانتظار" : "In waiting room"}
                      </span>
                    </div>
                    {appt.priorityLane !== "NONE" && (
                      <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {appt.priorityLane}
                      </span>
                    )}
                    <Link
                      href={`/appointments/${appt.id}/ticket`}
                      className="w-full mt-2 py-1.5 rounded-lg border border-border text-foreground font-semibold text-[11px] hover:bg-secondary transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-primary" />
                      <span>{tCommon("printTicket") || "طباعة التذكرة"}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. IN_PROGRESS Column */}
            <div className="bg-muted/30 rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{isRtl ? "جاري الكشف مع الطبيب" : "In Consultation"}</span>
                </span>
                <span className="text-[11px] font-mono font-bold bg-card px-2 py-0.5 rounded border border-border">
                  {boardData.inProgress.length}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                {boardData.inProgress.map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-xl border-2 border-amber-500/50 bg-amber-50/20 shadow-xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {isRtl ? appt.patient.fullNameAr : appt.patient.fullNameEn}
                      </span>
                      <span className="font-mono text-amber-700 font-extrabold text-sm">
                        #{appt.queueNo}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block font-mono">
                      {appt.ticketNo}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      <span>{isRtl ? "قيد الكشف داخل العيادة" : "Inside examination room"}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. COMPLETED / NO_SHOW Column */}
            <div className="bg-muted/30 rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{isRtl ? "تم الكشف / غياب" : "Completed / No-Show"}</span>
                </span>
                <span className="text-[11px] font-mono font-bold bg-card px-2 py-0.5 rounded border border-border">
                  {boardData.completedOrNoShow.length}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                {boardData.completedOrNoShow.map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-3 rounded-xl border border-border bg-card shadow-xs space-y-1 text-xs opacity-85"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {isRtl ? appt.patient.fullNameAr : appt.patient.fullNameEn}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          appt.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {appt.ticketNo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Walk-In Modal */}
        {showWalkInModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-foreground">
                    {t("walkInTitle")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("walkInNotice")}
              </p>

              <form onSubmit={handleWalkInSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {isRtl ? "الرقم القومي (14 رقم)" : "National ID"}
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={walkInNationalId}
                    onChange={(e) => setWalkInNationalId(e.target.value.replace(/\D/g, ""))}
                    placeholder="29501010101234"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {isRtl ? "اسم المواطن" : "Citizen Full Name"}
                  </label>
                  <input
                    type="text"
                    value={walkInNameAr}
                    onChange={(e) => setWalkInNameAr(e.target.value)}
                    placeholder="الاسم الرباعي"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {isRtl ? "رقم الهاتف المحمول" : "Phone Number"}
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="01012345678"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={walkInDisability}
                      onChange={(e) => setWalkInDisability(e.target.checked)}
                      className="rounded border-input text-primary"
                    />
                    <span>{isRtl ? "ذوي همم" : "Disability"}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={walkInPregnant}
                      onChange={(e) => setWalkInPregnant(e.target.checked)}
                      className="rounded border-input text-primary"
                    />
                    <span>{isRtl ? "سيدة حامل" : "Pregnancy"}</span>
                  </label>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowWalkInModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary cursor-pointer"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={walkInSubmitting}
                    className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
                  >
                    {walkInSubmitting ? tCommon("loading") : (isRtl ? "حجز الكشف الفوري" : "Book Walk-In")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
