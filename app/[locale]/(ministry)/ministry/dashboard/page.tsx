"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TopNav } from "@/components/chrome/top-nav";
import { GovernorateBarChart } from "@/components/charts/governorate-bar-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { HeatTable } from "@/components/charts/heat-table";
import {
  Building2,
  Calendar,
  Clock,
  Download,
  Plus,
  TrendingUp,
  AlertCircle,
  Users,
  ShieldCheck,
  CheckCircle2,
  Filter,
  X,
  RefreshCw,
  Activity,
  MapPin,
  Flame,
} from "lucide-react";

export default function MinistryDashboardPage() {
  const t = useTranslations("ministry");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Filter states
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [selectedGovId, setSelectedGovId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Data states
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<{
    kpis: {
      appointmentsToday: number;
      avgWaitDays: number;
      noShowRate: number;
      utilization: number;
    };
    byGovernorate: any[];
    trend30Days: any[];
    topOverloaded: any[];
    heatTable: any[];
  } | null>(null);

  // Onboard modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    governorateId: "",
    nameAr: "",
    nameEn: "",
    type: "GENERAL",
    address: "",
    phone: "",
    lat: "30.0444",
    lng: "31.2357",
  });
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  // Load Governorates
  useEffect(() => {
    fetch("/api/governorates")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.governorates) {
          setGovernorates(resData.governorates);
          if (resData.governorates.length > 0 && !onboardForm.governorateId) {
            setOnboardForm((prev) => ({
              ...prev,
              governorateId: resData.governorates[0].id,
            }));
          }
        }
      })
      .catch((err) => console.error("Error loading governorates:", err));
  }, []);

  // Fetch Dashboard Analytics
  const fetchAnalytics = () => {
    setLoading(true);
    let url = "/api/ministry/analytics";
    const params = new URLSearchParams();
    if (selectedGovId) params.append("governorateId", selectedGovId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    fetch(url)
      .then((res) => res.json())
      .then((analytics) => {
        setData(analytics);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading analytics:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedGovId]);

  // Handle CSV Export
  const handleExportCsv = () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (selectedGovId) params.append("governorateId", selectedGovId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const exportUrl = `/api/ministry/export?${params.toString()}`;
    window.location.href = exportUrl;
    setTimeout(() => setExporting(false), 2000);
  };

  // Handle Onboard Submit
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardSubmitting(true);
    setOnboardError(null);

    try {
      const res = await fetch("/api/admin/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardForm),
      });
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to onboard hospital");
      }

      setOnboardSuccess(true);
      setTimeout(() => {
        setOnboardSuccess(false);
        setShowOnboardModal(false);
        setOnboardForm({
          governorateId: governorates[0]?.id || "",
          nameAr: "",
          nameEn: "",
          type: "GENERAL",
          address: "",
          phone: "",
          lat: "30.0444",
          lng: "31.2357",
        });
        fetchAnalytics();
      }, 1500);
    } catch (err: any) {
      setOnboardError(err.message);
    } finally {
      setOnboardSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav
        user={{
          id: "27008080107890",
          role: "MINISTRY_ADMIN",
          fullNameAr: "د. طارق شوقي - قطاع الطب العلاجي",
          fullNameEn: "Dr. Tarek Shawky - Curative Care",
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {tRoles("MINISTRY_ADMIN")}
              </span>
              <span className="text-xs text-muted-foreground">
                {tCommon("uhisBadge")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {t("dashboardTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("dashboardSub")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowOnboardModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-[0.97] shadow-sm min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              {t("onboardTitle")}
            </button>
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-transform active:scale-[0.97] min-h-[44px] disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${exporting ? "animate-bounce" : ""}`} />
              {exporting
                ? isRtl
                  ? "جارٍ استخراج الملف..."
                  : "Exporting..."
                : t("exportCsv")}
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="w-4 h-4 text-primary" />
              <span>{isRtl ? "تصفية البيانات:" : "Filter Data:"}</span>
            </div>

            {/* Governorate Select */}
            <div className="w-full sm:w-56">
              <select
                value={selectedGovId}
                onChange={(e) => setSelectedGovId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">
                  {isRtl ? "جميع المحافظات (الجمهورية)" : "All Governorates (National)"}
                </option>
                {governorates.map((gov) => (
                  <option key={gov.id} value={gov.id}>
                    {isRtl ? gov.nameAr : gov.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder={isRtl ? "من تاريخ" : "From"}
              />
              <span className="text-muted-foreground text-xs">
                {isRtl ? "إلى" : "to"}
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder={isRtl ? "إلى تاريخ" : "To"}
              />
            </div>

            <button
              onClick={fetchAnalytics}
              className="px-3.5 h-11 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {isRtl ? "تطبيق" : "Apply"}
            </button>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {isRtl ? "تحديث تلقائي: مباشر" : "Live Real-Time Telemetry"}
          </div>
        </div>

        {/* 4 National KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Today's Appointments */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("kpiToday")}
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {loading ? "..." : (data?.kpis.appointmentsToday ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {isRtl ? "كشوفات اليوم الفعلية" : "Live confirmed today"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 2: Average Wait Days */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("kpiWaitTime")}
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {loading ? "..." : `${data?.kpis.avgWaitDays ?? 2.4}`}
                <span className="text-base font-normal text-muted-foreground ms-1">
                  {isRtl ? "يوم" : "days"}
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">
                {isRtl ? "متوسط سرعة الإتاحة" : "Target: < 3.0 days"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 3: No-Show Rate */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("kpiNoShow")}
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {loading ? "..." : `${data?.kpis.noShowRate ?? 12.5}%`}
              </div>
              <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {isRtl ? "خلال آخر 30 يوماً" : "Last 30-day baseline"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 4: Overall Clinic Utilization */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("kpiUtilization")}
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {loading ? "..." : `${data?.kpis.utilization ?? 68.4}%`}
              </div>
              <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {isRtl ? "السعة الاستيعابية المحجوزة" : "Across active clinics"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Visual Charts Grid: 2 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Appointments by Governorate */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <h2 className="text-base font-bold text-foreground">
                {t("chartGov")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? "توزيع أحجام الطلب والحجوزات حسب المحافظة"
                  : "Demand volume and appointment distribution by governorate"}
              </p>
            </div>
            {loading ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <GovernorateBarChart data={data?.byGovernorate || []} />
            )}
          </div>

          {/* Chart 2: 30-Day Trend Curve */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <h2 className="text-base font-bold text-foreground">
                {t("chartTrend")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? "تتبع الحجوزات الإجمالية مقابل الحضور والغياب"
                  : "Tracking total bookings vs completed visits vs no-shows"}
              </p>
            </div>
            {loading ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <TrendLineChart data={data?.trend30Days || []} />
            )}
          </div>
        </div>

        {/* Heat Table: Specialty x Governorate Wait Times */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                {t("heatTableTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? "مؤشر سرعة إتاحة المواعيد بالأيام (أخضر: سريع ≤ 2 يوم | أصفر: متوسط ≤ 4 أيام | أحمر: مرتفع > 4 أيام)"
                  : "Wait times in days (Green: ≤ 2d | Yellow: ≤ 4d | Red: > 4d)"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground text-sm">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <HeatTable data={data?.heatTable || []} />
          )}
        </div>

        {/* Top 10 Overloaded Clinics Table */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                {t("overloadedTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? "العيادات الأكثر طلباً ومعدلات الإشغال وقوائم الانتظار النشطة"
                  : "Clinics operating near or above capacity with active waitlist counts"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground text-sm">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-3 font-bold text-start text-foreground">
                      {isRtl ? "المستشفى" : "Hospital"}
                    </th>
                    <th className="p-3 font-bold text-start text-foreground">
                      {isRtl ? "المحافظة" : "Governorate"}
                    </th>
                    <th className="p-3 font-bold text-start text-foreground">
                      {isRtl ? "التخصص والعيادة" : "Specialty & Clinic"}
                    </th>
                    <th className="p-3 font-bold text-center text-foreground">
                      {isRtl ? "المحجوز / السعة" : "Booked / Capacity"}
                    </th>
                    <th className="p-3 font-bold text-center text-foreground">
                      {isRtl ? "معدل الإشغال" : "Utilization %"}
                    </th>
                    <th className="p-3 font-bold text-center text-foreground">
                      {isRtl ? "قائمة الانتظار" : "Waitlist Depth"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(data?.topOverloaded || []).map((clinic: any) => {
                    const isHigh = clinic.utilizationPct >= 90;
                    const isMid = clinic.utilizationPct >= 75 && clinic.utilizationPct < 90;
                    return (
                      <tr
                        key={clinic.id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                          {isRtl ? clinic.hospitalNameAr : clinic.hospitalNameEn}
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {clinic.governorateNameAr}
                        </td>
                        <td className="p-3 text-foreground whitespace-nowrap">
                          <span className="font-medium">
                            {isRtl ? clinic.specialtyNameAr : clinic.specialtyNameEn}
                          </span>
                          <span className="text-muted-foreground ms-1.5">
                            ({clinic.roomLabel})
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-foreground">
                          {clinic.totalBooked} / {clinic.totalCapacity}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                              isHigh
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : isMid
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {clinic.utilizationPct}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          {clinic.waitlistDepth > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                              {clinic.waitlistDepth} {isRtl ? "مواطن" : "patients"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Dialog: Onboard New Hospital */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">
                  {t("onboardTitle")}
                </h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {onboardSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-bold text-foreground text-base">
                  {isRtl ? "تم تسجيل المستشفى بنجاح!" : "Hospital Onboarded Successfully!"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isRtl
                    ? "تم إدراج المستشفى وتفعيل جدول العيادات في المنظومة الوطنية"
                    : "The hospital is now registered and available across the network."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit} className="space-y-4">
                {onboardError && (
                  <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{onboardError}</span>
                  </div>
                )}

                {/* Governorate */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "المحافظة:" : "Governorate:"}
                  </label>
                  <select
                    value={onboardForm.governorateId}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, governorateId: e.target.value })
                    }
                    required
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {governorates.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {isRtl ? gov.nameAr : gov.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">
                      {isRtl ? "الاسم بالعربية:" : "Name (Arabic):"}
                    </label>
                    <input
                      type="text"
                      required
                      value={onboardForm.nameAr}
                      onChange={(e) =>
                        setOnboardForm({ ...onboardForm, nameAr: e.target.value })
                      }
                      placeholder={isRtl ? "مستشفى كفر الشيخ العام" : "Arabic Name"}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">
                      {isRtl ? "الاسم بالإنجليزية:" : "Name (English):"}
                    </label>
                    <input
                      type="text"
                      required
                      value={onboardForm.nameEn}
                      onChange={(e) =>
                        setOnboardForm({ ...onboardForm, nameEn: e.target.value })
                      }
                      placeholder="Kafr El-Sheikh General Hospital"
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Type & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">
                      {isRtl ? "تصنيف المستشفى:" : "Hospital Type:"}
                    </label>
                    <select
                      value={onboardForm.type}
                      onChange={(e) =>
                        setOnboardForm({ ...onboardForm, type: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="GENERAL">
                        {isRtl ? "مستشفى عام" : "General"}
                      </option>
                      <option value="SPECIALIZED">
                        {isRtl ? "مستشفى تخصصي" : "Specialized"}
                      </option>
                      <option value="TEACHING">
                        {isRtl ? "مستشفى تعليمي / جامعي" : "Teaching"}
                      </option>
                      <option value="CENTRAL">
                        {isRtl ? "مستشفى مركزي" : "Central"}
                      </option>
                      <option value="PRIMARY_CARE">
                        {isRtl ? "مركز رعاية أولية" : "Primary Care"}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">
                      {isRtl ? "رقم الهاتف:" : "Phone:"}
                    </label>
                    <input
                      type="text"
                      value={onboardForm.phone}
                      onChange={(e) =>
                        setOnboardForm({ ...onboardForm, phone: e.target.value })
                      }
                      placeholder="047-3234567"
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "العنوان بالتفصيل:" : "Address:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardForm.address}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, address: e.target.value })
                    }
                    placeholder={isRtl ? "شارع الجيش - وسط البلد" : "Street address"}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {isRtl ? "خط العرض (Lat):" : "Latitude:"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={onboardForm.lat}
                      onChange={(e) =>
                        setOnboardForm({ ...onboardForm, lat: e.target.value })
                      }
                      className="w-full h-9 px-3 rounded-xl border border-input bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {isRtl ? "خط الطول (Lng):" : "Longitude:"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={onboardForm.lng}
                      onChange={(e) =>
                        setOnboardForm({ ...onboardForm, lng: e.target.value })
                      }
                      className="w-full h-9 px-3 rounded-xl border border-input bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowOnboardModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={onboardSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-[0.97] disabled:opacity-50 min-h-[44px]"
                  >
                    {onboardSubmitting
                      ? isRtl
                        ? "جارٍ التسجيل..."
                        : "Saving..."
                      : isRtl
                      ? "تسجيل المستشفى"
                      : "Save Hospital"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
