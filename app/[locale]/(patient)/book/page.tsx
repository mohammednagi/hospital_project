"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  Search,
  Sparkles,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

export default function BookStep1Page() {
  const t = useTranslations("patient");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  // Sample symptom chips for one-click testing
  const sampleSymptoms = isRtl
    ? ["وجع بطن ومغص", "سخونية شديدة", "صداع وزغللة", "وجع ظهر ومفاصل", "ألم في الصدر وخفقان", "كحة واحتقان زور", "حكة وطفح جلدي"]
    : ["stomach pain", "high fever", "headache & blur", "back pain & joints", "chest pain & palpitations", "cough & sore throat", "skin rash"];

  useEffect(() => {
    // Fetch all specialties
    fetch("/api/specialties")
      .then((res) => res.json())
      .then((data) => {
        if (data.specialties) setSpecialties(data.specialties);
      })
      .catch((err) => console.error(err));
  }, []);

  // Search suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch("/api/specialties/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, locale }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.suggestions) setSuggestions(data.suggestions);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, locale]);

  const handleSelectSpecialty = (code: string) => {
    router.push(`/book/hospital?specialtyCode=${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <TopNav user={null} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold">1</span>
          <span className="text-foreground">{t("step1Title")}</span>
          <span>/</span>
          <span>{isRtl ? "المستشفى" : "Hospital"}</span>
          <span>/</span>
          <span>{isRtl ? "الموعد" : "Slot"}</span>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {t("step1Title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("step1Sub")}
          </p>
        </div>

        {/* Free-Text Symptom Input */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("symptomPlaceholder")}
              className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed resize-none"
            />
            {loading && (
              <span className="absolute top-4 end-4 text-xs text-muted-foreground animate-pulse">
                {tCommon("loading")}
              </span>
            )}
          </div>

          {/* Symptom Quick Chips */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground block mb-2">
              {isRtl ? "أمثلة شائعة للاختيار السريع:" : "Common examples:"}
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleSymptoms.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="px-3 py-1.5 rounded-full border border-border bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer Alert */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{t("disclaimer")}</span>
          </div>
        </div>

        {/* Suggested Specialties Cards */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {t("suggestedSpecialties")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestions.map((sugg) => (
                <button
                  key={sugg.code}
                  onClick={() => handleSelectSpecialty(sugg.code)}
                  className="p-4 rounded-xl border-2 border-primary/30 bg-card hover:border-primary hover:shadow-md transition-all text-start flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Stethoscope className="w-4 h-4" />
                      </span>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {Math.round(sugg.confidence * 100)}% {t("confidence")}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-foreground mb-1">
                      {isRtl ? sugg.nameAr : sugg.nameEn}
                    </h3>
                    {sugg.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sugg.matchedKeywords.map((kw: string) => (
                          <span
                            key={kw}
                            className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
                    <span>{isRtl ? "اختيار هذا التخصص" : "Select Specialty"}</span>
                    <ArrowIcon className="w-3.5 h-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direct List of All Available Specialties */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="text-sm font-bold text-foreground">
            {t("orSelectAll")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {specialties.map((spec) => (
              <button
                key={spec.code}
                onClick={() => handleSelectSpecialty(spec.code)}
                className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-start flex flex-col cursor-pointer"
              >
                <span className="font-bold text-xs text-foreground mb-0.5">
                  {isRtl ? spec.nameAr : spec.nameEn}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {spec.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomBar />
    </div>
  );
}
