"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TopNav } from "@/components/chrome/top-nav";
import {
  Building2,
  Calendar,
  Clock,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldAlert,
  Ban,
  TrendingUp,
  X,
} from "lucide-react";

export default function HospitalAdminClinicsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [clinicsData, setClinicsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Slots State
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState<number | null>(null);

  // Blackout Day Modal State
  const [showBlackoutModal, setShowBlackoutModal] = useState(false);
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");
  const [blackoutSubmitting, setBlackoutSubmitting] = useState(false);
  const [blackoutSuccess, setBlackoutSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/hospitals")
      .then((res) => res.json())
      .then((data) => {
        if (data.hospitals && data.hospitals.length > 0) {
          setHospitals(data.hospitals);
          setSelectedHospitalId(data.hospitals[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedHospitalId) return;
    setLoading(true);
    fetch(`/api/ministry/analytics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.topOverloaded) {
          setClinicsData(data.topOverloaded);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedHospitalId]);

  const handleGenerateSlots = async () => {
    setGenerating(true);
    setGenSuccess(null);
    try {
      const res = await fetch("/api/admin/generate-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId: selectedHospitalId, days: 14 }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenSuccess(data.slotsCreatedCount ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlackoutSubmitting(true);
    try {
      const res = await fetch("/api/admin/blackouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: selectedHospitalId,
          date: blackoutDate,
          reason: blackoutReason,
        }),
      });
      if (res.ok) {
        setBlackoutSuccess(true);
        setTimeout(() => {
          setShowBlackoutModal(false);
          setBlackoutSuccess(false);
          setBlackoutDate("");
          setBlackoutReason("");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBlackoutSubmitting(false);
    }
  };

  const currentHosp = hospitals.find((h) => h.id === selectedHospitalId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav user={{ id: "admin", role: "HOSPITAL_ADMIN", fullNameAr: "م. خالد مصطفى", fullNameEn: "Khaled Mostafa" }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header and Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {tRoles("HOSPITAL_ADMIN")}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("dashboardTitle")}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentHosp
                ? `${isRtl ? currentHosp.nameAr : currentHosp.nameEn} - ${currentHosp.address}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-input bg-card text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {isRtl ? h.nameAr : h.nameEn}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowBlackoutModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 text-destructive" />
              <span>{t("blackoutsTab")}</span>
            </button>

            {/* Idempotent Generate Slots Action */}
            <button
              onClick={handleGenerateSlots}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? tCommon("loading") : t("generateSlotsBtn")}</span>
            </button>
          </div>
        </div>

        {genSuccess !== null && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {locale === "ar"
                ? `تم توليد المواعيد بنجاح! أضيف ${genSuccess} موعداً جديداً غير مكرر للأسبوعين القادمين.`
                : `Slots generated successfully! Added ${genSuccess} new non-duplicate slots for the next 14 days.`}
            </span>
          </div>
        )}

        {/* Hospital Utilization & Doctor Load Table */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-base text-foreground">
                {isRtl ? "معدلات إشغال العيادات وعمق قائمة الانتظار" : "Clinic Utilization & Waitlist Depth"}
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              14-Day Capacity
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 px-3 text-start font-bold">العيادة والتخصص</th>
                  <th className="py-2.5 px-3 text-start font-bold">رقم الغرفة</th>
                  <th className="py-2.5 px-3 text-center font-bold">السعة المتاحة</th>
                  <th className="py-2.5 px-3 text-center font-bold">الحجوزات المؤكدة</th>
                  <th className="py-2.5 px-3 text-center font-bold">نسبة الإشغال</th>
                  <th className="py-2.5 px-3 text-center font-bold">قائمة الانتظار</th>
                </tr>
              </thead>
              <tbody>
                {clinicsData.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-foreground">
                      {isRtl ? c.specialtyNameAr : c.specialtyNameEn}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono">
                      {c.roomLabel}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {c.totalCapacity}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-primary">
                      {c.totalBooked}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full ${
                              c.utilizationPct > 90
                                ? "bg-rose-500"
                                : c.utilizationPct > 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, c.utilizationPct)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold">{c.utilizationPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono px-2 py-0.5 rounded-full bg-muted text-foreground font-bold">
                        {c.waitlistDepth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Blackout Modal */}
        {showBlackoutModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  <h3 className="font-bold text-base text-foreground">
                    {isRtl ? "إضافة يوم عطلة / إغلاق" : "Add Blackout Date"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBlackoutModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {blackoutSuccess ? (
                <div className="p-4 text-center text-xs text-emerald-700 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold">تم تسجيل يوم العطلة بنجاح</p>
                </div>
              ) : (
                <form onSubmit={handleCreateBlackout} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {tCommon("date")}
                    </label>
                    <input
                      type="date"
                      value={blackoutDate}
                      onChange={(e) => setBlackoutDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {isRtl ? "سبب الإغلاق / العطلة" : "Reason"}
                    </label>
                    <input
                      type="text"
                      value={blackoutReason}
                      onChange={(e) => setBlackoutReason(e.target.value)}
                      placeholder={isRtl ? "مثال: عطلة رسمية / صيانة دورية للعيادات" : "e.g. National holiday / Maintenance"}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowBlackoutModal(false)}
                      className="w-1/2 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary cursor-pointer"
                    >
                      {tCommon("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={blackoutSubmitting}
                      className="w-1/2 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 cursor-pointer disabled:opacity-50"
                    >
                      {blackoutSubmitting ? tCommon("loading") : (isRtl ? "تأكيد الإغلاق" : "Save Blackout")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
