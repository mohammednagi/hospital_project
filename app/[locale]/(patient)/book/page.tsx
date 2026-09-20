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

  // Large tactile symptom chips tailored for Egyptian patients
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

  // Search suggestions with debounce
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

  const handleSelectGeneralPractice = () => {
    // Fallback directly to General Practice (IM or PHO/PRACTICE)
    const general = specialties.find((s) => s.code === "IM") || specialties[0];
    if (general) {
      router.push(`/book/hospital?specialtyCode=${general.code}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-8">
      <TopNav user={null} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Step Indicator - Calm & Restrained */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-[11px] font-bold">1</span>
          <span className="text-foreground font-bold">{t("step1Title")}</span>
          <span className="text-muted-foreground/50">/</span>
          <span>{isRtl ? "المستشفى" : "Hospital"}</span>
          <span className="text-muted-foreground/50">/</span>
          <span>{isRtl ? "الموعد" : "Slot"}</span>
        </div>

        {/* Friendly Hero Header: "إيه اللي تعبك؟" */}
        <div className="text-start space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isRtl ? "إيه اللي تعبك النهاردة؟" : "What hurts today?"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRtl
              ? "اكتب أعراضك بكلماتك البسيطة، وسنقترح العيادة الأنسب لك."
              : "Describe symptoms simply, and we will route you to the right clinic."}
          </p>
        </div>

        {/* Symptom Input Card */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isRtl ? "مثال: عندي وجع في بطني ومغص من إمبارح ومفيش راحة..." : "e.g., Stomach cramps and pain since yesterday..."}
              className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
            />
            {loading && (
              <span className="absolute top-4 end-4 text-xs font-medium text-primary animate-pulse">
                {tCommon("loading")}
              </span>
            )}
          </div>

          {/* Quick Symptom Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground block">
              {isRtl ? "أعراض شائعة للاختيار السريع:" : "Common symptoms:"}
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleSymptoms.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="px-3.5 py-2 min-h-[44px] rounded-full border border-border bg-secondary/60 hover:bg-secondary text-xs font-semibold text-foreground transition-all active:scale-[0.97] cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Escape Hatch: "مش عارف، اختار لي عام" */}
          <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSelectGeneralPractice}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-full border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent-foreground text-xs font-bold transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-accent" />
              <span>{isRtl ? "مش عارف؟ احجز في عيادة الباطنة العامة" : "Not sure? Choose General Practice"}</span>
            </button>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{isRtl ? "للحالات الحرجة، توجه فوراً لطوارئ 123" : "For emergencies, dial 123 immediately"}</span>
            </div>
          </div>
        </div>

        {/* Suggested Specialties Cards */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                {t("suggestedSpecialties")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestions.map((sugg) => (
                <button
                  key={sugg.code}
                  onClick={() => handleSelectSpecialty(sugg.code)}
                  className="p-4 rounded-xl border-2 border-primary/40 bg-card hover:border-primary hover:bg-primary/5 transition-all text-start flex flex-col justify-between group cursor-pointer active:scale-[0.97]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Stethoscope className="w-4 h-4" />
                      </span>
                      <span className="text-[11px] font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
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
                            className="text-[10px] bg-secondary text-secondary-foreground font-medium px-2 py-0.5 rounded-md"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
                    <span>{isRtl ? "اختيار هذه العيادة" : "Select Clinic"}</span>
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {specialties.map((spec) => (
              <button
                key={spec.code}
                onClick={() => handleSelectSpecialty(spec.code)}
                className="p-3.5 min-h-[48px] rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-start flex flex-col justify-center cursor-pointer active:scale-[0.97]"
              >
                <span className="font-bold text-sm text-foreground mb-0.5">
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
