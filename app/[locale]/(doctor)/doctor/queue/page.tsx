"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TopNav } from "@/components/chrome/top-nav";
import {
  Stethoscope,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PhoneCall,
  UserX,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function DoctorQueuePage() {
  const t = useTranslations("doctor");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const tPriority = useTranslations("priorityLanes");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [activePatient, setActivePatient] = useState<any>(null);
  const [waitingQueue, setWaitingQueue] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Outcome Note State (Strictly <= 280 chars)
  const [outcomeNote, setOutcomeNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Server Time & Grace Period Tracker
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueue = () => {
    setLoading(true);
    fetch("/api/doctor/queue")
      .then((res) => res.json())
      .then((data) => {
        if (data.active) {
          setActivePatient(data.active);
          setOutcomeNote(data.active.outcomeNote || "");
        } else {
          setActivePatient(null);
          setOutcomeNote("");
        }
        if (data.queue) setWaitingQueue(data.queue);
        if (data.history) setHistory(data.history);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Call Next Patient
  const handleCallNext = async (appointmentId?: string) => {
    const targetId = appointmentId || waitingQueue[0]?.id;
    if (!targetId) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/doctor/call-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: targetId }),
      });

      if (res.ok) {
        setMessage({
          text: locale === "ar" ? "تم استدعاء المريض لغرفة الكشف" : "Patient called into consultation room",
          type: "success",
        });
        fetchQueue();
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to call next", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Consultation
  const handleComplete = async () => {
    if (!activePatient) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/doctor/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: activePatient.id,
          outcomeNote,
        }),
      });

      if (res.ok) {
        setMessage({
          text: locale === "ar" ? "تم إتمام الكشف بنجاح وحفظ التقرير الطبي" : "Consultation completed & medical report saved",
          type: "success",
        });
        fetchQueue();
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to complete", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Mark No-Show (Only allowed after 15 min grace)
  const handleMarkNoShow = async (appointmentId: string) => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/doctor/no-show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Grace period not elapsed", type: "error" });
      } else {
        setMessage({
          text: locale === "ar" ? "تم تسجيل غياب المريض (No-Show)" : "Marked patient as No-Show",
          type: "success",
        });
        fetchQueue();
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to mark no-show", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate 15 min grace period with percentage for SVG circle
  const getGraceStatus = (slotStartsAt: string | Date) => {
    const start = new Date(slotStartsAt);
    const elapsedMinutes = (currentTime.getTime() - start.getTime()) / (1000 * 60);

    if (elapsedMinutes >= 15) {
      return { allowed: true, percent: 100, remainingMin: 0, text: t("graceExpired") };
    }
    const remainingMin = Math.max(0, Math.ceil(15 - elapsedMinutes));
    const percent = Math.min(100, Math.max(0, (elapsedMinutes / 15) * 100));
    return {
      allowed: false,
      percent,
      remainingMin,
      text: `${t("gracePeriodRemaining")} ${remainingMin} ${isRtl ? "د" : "m"}`,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
      <TopNav user={{ id: "doctor", role: "DOCTOR", fullNameAr: "د. حازم عبد الله الجزار", fullNameEn: "Dr. Hazem El-Gazzar" }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Workstation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
                {tRoles("DOCTOR")}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t("workspaceTitle")}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isRtl ? "نظام الأولوية الذكي: ذوي الهمم والحوامل وكبار السن في مقدمة الطابور" : "Priority lane active: Disability, Pregnancy, and Elderly patients served first"}
            </p>
          </div>

          {waitingQueue.length > 0 && !activePatient && (
            <button
              onClick={() => handleCallNext()}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t("callNext")} (#{waitingQueue[0]?.queueNo})</span>
            </button>
          )}
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-teal-50 border-teal-200 text-teal-900"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Active Consultation Workstation Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-3xl border border-border p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-base text-foreground">
                    {t("activeConsultation")}
                  </h2>
                </div>

                {activePatient && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 animate-pulse font-mono tabular-nums">
                    #{activePatient.queueNo} {isRtl ? "قيد الكشف" : "In Progress"}
                  </span>
                )}
              </div>

              {activePatient ? (
                <div className="space-y-4">
                  {/* Patient Bio & Priority Banner */}
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">
                          {isRtl ? activePatient.patient.fullNameAr : activePatient.patient.fullNameEn}
                        </span>
                        {activePatient.priorityLane !== "NONE" && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent-foreground border border-accent/30">
                            {tPriority(activePatient.priorityLane)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono tabular-nums font-semibold">
                          {activePatient.patient.nationalId}
                        </span>
                        <span>•</span>
                        <span>{activePatient.patient.gender === "MALE" ? (isRtl ? "ذكر" : "Male") : (isRtl ? "أنثى" : "Female")}</span>
                        <span>•</span>
                        <span className="font-mono tabular-nums">{activePatient.ticketNo}</span>
                      </div>
                    </div>

                    {/* Circular Countdown Grace Ring */}
                    {(() => {
                      const grace = getGraceStatus(activePatient.slot.startsAt);
                      const strokeDash = 2 * Math.PI * 18;
                      const strokeOffset = strokeDash - (strokeDash * grace.percent) / 100;
                      return (
                        <div className="flex items-center gap-3 shrink-0 bg-card p-2.5 rounded-2xl border border-border">
                          <div className="relative w-11 h-11 flex items-center justify-center">
                            <svg className="w-11 h-11 transform -rotate-90">
                              <circle
                                cx="22"
                                cy="22"
                                r="18"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-secondary"
                                fill="transparent"
                              />
                              <circle
                                cx="22"
                                cy="22"
                                r="18"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={strokeDash}
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                                className={`transition-all duration-500 ${
                                  grace.allowed ? "text-destructive" : grace.percent > 60 ? "text-amber-500" : "text-primary"
                                }`}
                                fill="transparent"
                              />
                            </svg>
                            <span className="absolute text-[10px] font-mono font-bold tabular-nums">
                              {grace.remainingMin}m
                            </span>
                          </div>
                          <div className="text-start">
                            <span className="text-[10px] text-muted-foreground block font-medium">
                              {isRtl ? "مهلة الحضور" : "Grace Period"}
                            </span>
                            <span className="text-[11px] font-bold text-foreground">
                              {grace.allowed ? (isRtl ? "انتهت المهلة" : "Expired") : `${grace.remainingMin} ${isRtl ? "دقيقة متبقية" : "min left"}`}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Outcome Note Editor (<= 280 chars) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <label>{t("consultationNote")}</label>
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          outcomeNote.length > 250
                            ? "text-destructive font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {outcomeNote.length} / 280
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      maxLength={280}
                      value={outcomeNote}
                      onChange={(e) => setOutcomeNote(e.target.value)}
                      placeholder={isRtl ? "اكتب التشخيص والتوجيهات الطبية والعلاج المصروف للمريض..." : "Enter medical diagnosis and recommendations..."}
                      className="w-full p-3.5 rounded-2xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
                    />
                  </div>

                  {/* Doctor Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {(() => {
                      const grace = getGraceStatus(activePatient.slot.startsAt);
                      return (
                        <button
                          onClick={() => handleMarkNoShow(activePatient.id)}
                          disabled={actionLoading || !grace.allowed}
                          className="px-4 py-2.5 min-h-[44px] rounded-full border border-destructive/30 text-destructive text-xs font-bold hover:bg-destructive/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
                        >
                          <UserX className="w-4 h-4" />
                          <span>{t("markNoShow")}</span>
                        </button>
                      );
                    })()}

                    <button
                      onClick={handleComplete}
                      disabled={actionLoading}
                      className="px-7 py-2.5 min-h-[44px] rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t("markCompleted")}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-muted-foreground space-y-3">
                  <p className="text-sm font-medium">{isRtl ? "لا يوجد مريض قيد الكشف حالياً." : "No patient currently inside examination room."}</p>
                  {waitingQueue.length > 0 && (
                    <button
                      onClick={() => handleCallNext()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
                    >
                      <span>{t("callNext")} (#{waitingQueue[0]?.queueNo})</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 1-Column Priority Queue Section */}
          <div className="space-y-4">
            <div className="bg-card rounded-3xl border border-border p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">
                  {t("queueList")}
                </h3>
                <span className="font-mono text-xs font-bold bg-secondary px-2.5 py-0.5 rounded-full text-foreground tabular-nums">
                  {waitingQueue.length}
                </span>
              </div>

              {waitingQueue.length > 0 ? (
                <div className="space-y-2 max-h-[520px] overflow-y-auto">
                  {waitingQueue.map((appt, idx) => (
                    <div
                      key={appt.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                        appt.priorityLane !== "NONE"
                          ? "bg-accent/10 border-accent/30"
                          : "bg-secondary/30 border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {isRtl ? appt.patient.fullNameAr : appt.patient.fullNameEn}
                        </span>
                        <span className="font-mono font-extrabold text-primary text-sm tabular-nums">
                          #{appt.queueNo}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-mono tabular-nums">{appt.ticketNo}</span>
                        {appt.priorityLane !== "NONE" ? (
                          <span className="text-[10px] font-bold text-accent-foreground bg-accent/25 px-2 py-0.5 rounded-full">
                            {tPriority(appt.priorityLane)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{isRtl ? "طابور عام" : "Standard"}</span>
                        )}
                      </div>

                      {!activePatient && idx === 0 && (
                        <button
                          onClick={() => handleCallNext(appt.id)}
                          className="w-full mt-1 py-2 min-h-[38px] rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{t("callNext")}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-10">
                  {isRtl ? "صالة الانتظار فارغة حالياً." : "Waiting queue is empty."}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
