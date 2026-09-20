"use client";

import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  CheckCircle2,
  CalendarRange,
  AlertCircle,
  BellRing,
} from "lucide-react";

export default function BookSlotPage({
  searchParams,
}: {
  searchParams: Promise<{
    hospitalId?: string;
    specialtyCode?: string;
    clinicId?: string;
  }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const hospitalId = resolvedSearchParams?.hospitalId || "";
  const specialtyCode = resolvedSearchParams?.specialtyCode || "GP";
  const clinicId = resolvedSearchParams?.clinicId || "";

  const t = useTranslations("patient");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [viewMode, setViewMode] = useState<"RECOMMENDED" | "ALL">("RECOMMENDED");
  const [recommendedSlots, setRecommendedSlots] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [hasSlotsUnder7Days, setHasSlotsUnder7Days] = useState(true);
  const [loading, setLoading] = useState(true);
  const [waitlistJoining, setWaitlistJoining] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    let url = `/api/slots/search?specialtyCode=${specialtyCode}&locale=${locale}`;
    if (hospitalId) url += `&hospitalId=${hospitalId}`;
    if (clinicId) url += `&clinicId=${clinicId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.recommended) setRecommendedSlots(data.recommended);
        if (data.allAvailable) setAllSlots(data.allAvailable);
        setHasSlotsUnder7Days(data.hasSlotsUnder7Days ?? true);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [hospitalId, specialtyCode, clinicId, locale]);

  const handleSelectSlot = (slotId: string) => {
    router.push(`/book/confirm?slotId=${slotId}`);
  };

  const handleJoinWaitlist = async () => {
    setWaitlistJoining(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: clinicId || allSlots[0]?.clinicId,
          preferredDate: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setWaitlistSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWaitlistJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <TopNav user={null} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
          <Link href="/book" className="hover:text-foreground">
            {t("step1Title")}
          </Link>
          <span>/</span>
          <Link href={`/book/hospital?specialtyCode=${specialtyCode}`} className="hover:text-foreground">
            {t("step2Title")}
          </Link>
          <span>/</span>
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold">3</span>
          <span className="text-foreground">{t("step3Title")}</span>
        </div>

        {/* Header with Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {t("step3Title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("step3Sub")}
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-muted border border-border">
            <button
              onClick={() => setViewMode("RECOMMENDED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "RECOMMENDED"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("recommendedSlots")}
            </button>
            <button
              onClick={() => setViewMode("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "ALL"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("allSlots")}
            </button>
          </div>
        </div>

        {/* Smart Waitlist Prompt if no slot <= 7 days */}
        {!hasSlotsUnder7Days && (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t("waitlistPrompt")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("waitlistSuccess")}
                </p>
              </div>
            </div>

            <button
              onClick={handleJoinWaitlist}
              disabled={waitlistJoining || waitlistSuccess}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {waitlistSuccess
                ? (isRtl ? "تم الانضمام للقائمة بنجاح ✓" : "Joined Waitlist ✓")
                : waitlistJoining
                ? tCommon("loading")
                : t("joinWaitlist")}
            </button>
          </div>
        )}

        {/* Slot Results */}
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
            {tCommon("loading")}
          </div>
        ) : viewMode === "RECOMMENDED" ? (
          /* Top 5 Smart Recommended Slots */
          <div className="space-y-3">
            {recommendedSlots.length > 0 ? (
              recommendedSlots.map((item, index) => {
                const s = item.slot;
                const startDate = new Date(s.startsAt);
                return (
                  <div
                    key={s.id}
                    className="p-5 rounded-2xl border-2 border-primary/20 bg-card hover:border-primary hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">
                            {startDate.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="font-bold text-sm text-primary">
                            {startDate.toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Hospital & Department */}
                      <p className="text-xs text-muted-foreground">
                        {isRtl ? s.hospital.nameAr : s.hospital.nameEn} • {isRtl ? s.specialty?.nameAr : s.specialty?.nameEn}
                      </p>

                      {/* Explainable Intelligence Reason Badge */}
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent-foreground border border-accent/30">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span>{item.reason}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectSlot(s.id)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>{isRtl ? "اختيار هذا الموعد" : "Select Slot"}</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl bg-card border border-border text-center text-xs text-muted-foreground">
                {isRtl ? "لا توجد فترات موصى بها متاحة حالياً." : "No recommended slots available."}
              </div>
            )}
          </div>
        ) : (
          /* Full Schedule Calendar Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allSlots.map((s) => {
              const startDate = new Date(s.startsAt);
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSlot(s.id)}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-start transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-foreground">
                        {startDate.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-bold text-xs text-primary font-mono">
                        {startDate.toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {isRtl ? s.hospital.nameAr : s.hospital.nameEn}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] font-semibold text-primary">
                    <span>{isRtl ? "حجز الفترة" : "Book Slot"}</span>
                    <ArrowIcon className="w-3 h-3 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <MobileBottomBar />
    </div>
  );
}
