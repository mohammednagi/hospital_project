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
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Timer,
  Building2,
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
          text: locale === "ar" ? "تم النداء على المريض وبدء الكشف" : "Patient called to examination room",
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
          text: locale === "ar" ? "تم إتمام الكشف بنجاح وتسجيل التقرير" : "Consultation completed successfully",
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

  // Calculate 15 min grace period for a given slot start time
  const getGraceStatus = (slotStartsAt: string | Date) => {
    const start = new Date(slotStartsAt);
    const elapsedMinutes = (currentTime.getTime() - start.getTime()) / (1000 * 60);

    if (elapsedMinutes >= 15) {
      return { allowed: true, text: t("graceExpired") };
    }
    const remainingMin = Math.max(0, Math.ceil(15 - elapsedMinutes));
    return {
      allowed: false,
      text: `${t("gracePeriodRemaining")} ${remainingMin} ${isRtl ? "دقيقة" : "min"}`,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav user={{ id: "doctor", role: "DOCTOR", fullNameAr: "د. طارق عبد العزيز", fullNameEn: "Dr. Tarek Abdel Aziz" }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                {tRoles("DOCTOR")}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("workspaceTitle")}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRtl ? "العيادة تعمل بنظام أولوية الفئات الخاصة (ذوي الهمم والحوامل وكبار السن أولاً)" : "Queue prioritized: Disability, Pregnancy, and Elderly lanes served first"}
            </p>
          </div>

          {waitingQueue.length > 0 && !activePatient && (
            <button
              onClick={() => handleCallNext()}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t("callNext")} (#{waitingQueue[0]?.queueNo})</span>
            </button>
          )}
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Active Consultation Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-base text-foreground">
                    {t("activeConsultation")}
                  </h2>
                </div>

                {activePatient && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                    قيد الكشف الآن (#{activePatient.queueNo})
                  </span>
                )}
              </div>

              {activePatient ? (
                <div className="space-y-4">
                  {/* Patient Bio Box */}
                  <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">
                          {isRtl ? activePatient.patient.fullNameAr : activePatient.patient.fullNameEn}
                        </span>
                        {activePatient.priorityLane !== "NONE" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            {tPriority(activePatient.priorityLane)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">
                          {activePatient.patient.nationalId}
                        </span>
                        <span>•</span>
                        <span>{activePatient.patient.gender === "MALE" ? "ذكر" : "أنثى"}</span>
                        <span>•</span>
                        <span>تذكرة: {activePatient.ticketNo}</span>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="text-[11px] text-muted-foreground block">{tCommon("time")}</span>
                      <span className="font-bold text-sm text-primary font-mono">
                        {new Date(activePatient.slot.startsAt).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Outcome Note Editor with 280 Char Limit */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <label>{t("consultationNote")}</label>
                      <span
                        className={`font-mono text-[11px] ${
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
                      placeholder={isRtl ? "اكتب التشخيص والتوجيهات الطبية للمريض والعلاج المصروف..." : "Enter diagnosis and outcome notes..."}
                      className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {/* No-Show Button with Grace Period Check */}
                    {(() => {
                      const grace = getGraceStatus(activePatient.slot.startsAt);
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkNoShow(activePatient.id)}
                            disabled={actionLoading || !grace.allowed}
                            className="px-3.5 py-2 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>{t("markNoShow")}</span>
                          </button>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            {grace.text}
                          </span>
                        </div>
                      );
                    })()}

                    <button
                      onClick={handleComplete}
                      disabled={actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t("markCompleted")}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <p>{isRtl ? "لا يوجد مريض قيد الكشف حالياً." : "No patient currently inside examination room."}</p>
                  {waitingQueue.length > 0 && (
                    <button
                      onClick={() => handleCallNext()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <span>{t("callNext")} (#{waitingQueue[0]?.queueNo})</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ordered Waiting Queue Section */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">
                  {t("queueList")}
                </h3>
                <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground">
                  {waitingQueue.length}
                </span>
              </div>

              {waitingQueue.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {waitingQueue.map((appt, idx) => {
                    const grace = getGraceStatus(appt.slot.startsAt);
                    return (
                      <div
                        key={appt.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                          appt.priorityLane !== "NONE"
                            ? "bg-purple-50/50 border-purple-200"
                            : "bg-muted/20 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">
                              {isRtl ? appt.patient.fullNameAr : appt.patient.fullNameEn}
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-primary">
                            #{appt.queueNo}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-mono">{appt.ticketNo}</span>
                          {appt.priorityLane !== "NONE" ? (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                              {tPriority(appt.priorityLane)}
                            </span>
                          ) : (
                            <span>طابور عادي</span>
                          )}
                        </div>

                        {/* Call action if no active patient */}
                        {!activePatient && idx === 0 && (
                          <button
                            onClick={() => handleCallNext(appt.id)}
                            className="w-full mt-2 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] hover:bg-primary/90 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{t("callNext")}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">
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
