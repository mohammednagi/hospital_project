"use client";

import { useState, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

export default function BookConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ slotId?: string }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const slotId = resolvedSearchParams?.slotId || "";

  const t = useTranslations("patient");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, source: "WEB" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to confirm appointment");
        setLoading(false);
        return;
      }

      // Redirect immediately to the official ticket page
      router.push(`/appointments/${data.appointment.id}/ticket`);
    } catch (err: any) {
      setError(err.message || "Error confirming appointment");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-28 sm:pb-8">
      <TopNav user={null} />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link href="/book" className="hover:text-foreground">
            {t("step1Title")}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span>{isRtl ? "المستشفى" : "Hospital"}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-[11px] font-bold">4</span>
          <span className="text-foreground font-bold">{t("step4Title")}</span>
        </div>

        {/* Receipt-style Confirmation Card */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t("step4Title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t("step4Sub")}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Official MoHP Receipt Breakdown */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{tCommon("portalName")}</span>
              <span className="font-bold text-primary">{tCommon("appName")}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{isRtl ? "رمز الفترة المحجوزة" : "Slot Identifier"}</span>
              <span className="font-mono text-muted-foreground font-medium">{slotId ? slotId.slice(0, 18) + "..." : "—"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{isRtl ? "طابور الأولوية" : "Priority Lane"}</span>
              <span className="font-bold text-accent-foreground bg-accent/20 px-2.5 py-0.5 rounded-full text-[11px]">
                {isRtl ? "مُحدد تلقائياً حسب الرقم القومي" : "Computed from National ID"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">{isRtl ? "رسوم الخدمة" : "Visit Fee"}</span>
              <span className="font-bold text-primary font-mono text-sm">
                {isRtl ? "مجاني (تحت مظلة التأمين الصحي الشامل)" : "Free (MoHP UHIS Covered)"}
              </span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex flex-col gap-2.5 pt-2">
            <button
              onClick={handleConfirmBooking}
              disabled={loading || !slotId}
              className="w-full py-3.5 min-h-[48px] rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
            >
              {loading ? (
                <span>{tCommon("loading")}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isRtl ? "تأكيد الحجز وإصدار التذكرة الرسمية" : "Confirm & Issue Official Ticket"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-2.5 min-h-[44px] rounded-full border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer active:scale-[0.97]"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </div>
      </main>

      {/* Sticky Full-Width Action at Viewport Bottom for Mobile */}
      <div className="sm:hidden fixed bottom-14 left-0 right-0 p-3 chrome-translucent shadow-[0_-2px_12px_rgba(0,0,0,0.08)] z-30">
        <button
          onClick={handleConfirmBooking}
          disabled={loading || !slotId}
          className="w-full py-3.5 min-h-[48px] rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
        >
          {loading ? (
            <span>{tCommon("loading")}</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>{isRtl ? "تأكيد الحجز وإصدار التذكرة" : "Confirm & Issue Ticket"}</span>
            </>
          )}
        </button>
      </div>

      <MobileBottomBar />
    </div>
  );
}
