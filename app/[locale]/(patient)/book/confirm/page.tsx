"use client";

import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  Stethoscope,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Ticket,
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
  const tPriority = useTranslations("priorityLanes");
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
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <TopNav user={null} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
          <Link href="/book" className="hover:text-foreground">
            {t("step1Title")}
          </Link>
          <span>/</span>
          <span>{isRtl ? "المستشفى" : "Hospital"}</span>
          <span>/</span>
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold">4</span>
          <span className="text-foreground">{t("step4Title")}</span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("step4Title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t("step4Sub")}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Booking Summary Box */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{tCommon("portalName")}</span>
              <span className="font-bold text-primary">{tCommon("appName")}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{isRtl ? "معرف الفترة" : "Slot ID"}</span>
              <span className="font-mono text-muted-foreground">{slotId}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{isRtl ? "طابور الأولوية" : "Priority Lane"}</span>
              <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded">
                {isRtl ? "تلقائي حسب البيانات (كبار سن / ذوي همم / حوامل)" : "Auto-computed by profile"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">{isRtl ? "قيمة الكشف" : "Visit Fee"}</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">
                {isRtl ? "مجاني (تحت مظلة التأمين الصحي الشامل)" : "Free (MoHP UHIS Covered)"}
              </span>
            </div>
          </div>

          {/* Confirmation Action */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleConfirmBooking}
              disabled={loading || !slotId}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              className="w-full py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </div>
      </main>

      <MobileBottomBar />
    </div>
  );
}
