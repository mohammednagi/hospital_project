"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { parseNationalId, EGYPTIAN_GOVERNORATE_CODES } from "@/lib/smart/national-id";
import { registerPatientAction } from "@/server/actions/auth.actions";
import { Building2, ShieldCheck, UserCheck, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  // Form State
  const [nationalId, setNationalId] = useState("");
  const [fullNameAr, setFullNameAr] = useState("");
  const [fullNameEn, setFullNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [governorates, setGovernorates] = useState<{ id: string; code: string; nameAr: string; nameEn: string }[]>([]);
  const [hasDisability, setHasDisability] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);

  // Inferred State from parser
  const [inferred, setInferred] = useState<{
    isValid: boolean;
    birthDate?: Date;
    gender?: "MALE" | "FEMALE";
    governorateCode?: string;
    error?: string;
  }>({ isValid: false });

  // OTP Modal State
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch governorates
    fetch("/api/governorates")
      .then((res) => res.json())
      .then((data) => {
        if (data.governorates) {
          setGovernorates(data.governorates);
        }
      })
      .catch((err) => console.error("Failed to load governorates:", err));
  }, []);

  // Real-time National ID parser
  useEffect(() => {
    if (nationalId.length === 14) {
      const res = parseNationalId(nationalId);
      setInferred(res);

      if (res.isValid && res.governorateCode && governorates.length > 0) {
        const matchingGov = governorates.find((g) => g.code === res.governorateCode);
        if (matchingGov && !governorateId) {
          setGovernorateId(matchingGov.id);
        }
      }
    } else {
      setInferred({ isValid: false });
    }
  }, [nationalId, governorates]);

  // Formatted 2-6-2-4 helper display
  const getFormattedNid = (nid: string) => {
    if (!nid) return "";
    const p1 = nid.slice(0, 1);
    const p2 = nid.slice(1, 7);
    const p3 = nid.slice(7, 9);
    const p4 = nid.slice(9, 13);
    const p5 = nid.slice(13, 14);
    return [p1, p2, p3, p4, p5].filter(Boolean).join(" - ");
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inferred.isValid) {
      setError(inferred.error || t("invalidNid"));
      return;
    }

    if (!phone.match(/^01[0125][0-9]{8}$/)) {
      setError(t("invalidPhone"));
      return;
    }

    if (!governorateId) {
      setError(locale === "ar" ? "يرجى اختيار المحافظة" : "Please select governorate");
      return;
    }

    setStep("OTP");
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("nationalId", nationalId);
    formData.append("fullNameAr", fullNameAr);
    formData.append("fullNameEn", fullNameEn);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("governorateId", governorateId);
    formData.append("hasDisability", String(hasDisability));
    formData.append("isPregnant", String(isPregnant));
    formData.append("otpCode", otpCode);

    try {
      const result = await registerPatientAction(formData);

      if (!result.success) {
        setError(result.error || "Failed to register");
        setLoading(false);
        return;
      }

      // Registration success -> route to login
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav user={null} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t("registerTitle")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("registerSub")}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === "FORM" ? (
              <form onSubmit={handleProceedToOtp} className="space-y-4">
                {/* 1. National ID Input with 2-6-2-4 format display */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      {t("nationalId")}
                    </label>
                    {nationalId.length > 0 && (
                      <span className="text-[11px] font-mono text-primary font-bold">
                        {getFormattedNid(nationalId)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={14}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
                    placeholder="29501010101234"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground font-mono text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t("nationalIdHelp")}
                  </p>
                </div>

                {/* Live Inferred Card */}
                {nationalId.length === 14 && (
                  <div
                    className={`p-4 rounded-2xl border text-xs transition-all ${
                      inferred.isValid
                        ? "bg-primary/5 border-primary/20 text-foreground"
                        : "bg-destructive/5 border-destructive/20 text-destructive"
                    }`}
                  >
                    {inferred.isValid ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-primary">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t("inferredData")}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-primary/10">
                          <div>
                            <span className="text-muted-foreground block text-[11px]">{t("birthDate")}</span>
                            <span className="font-bold text-foreground">
                              {inferred.birthDate?.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[11px]">{t("gender")}</span>
                            <span className="font-bold text-foreground">
                              {inferred.gender === "MALE" ? t("genderMale") : t("genderFemale")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[11px]">{t("governorate")}</span>
                            <span className="font-bold text-foreground">
                              {inferred.governorateCode
                                ? EGYPTIAN_GOVERNORATE_CODES[inferred.governorateCode]?.[locale === "ar" ? "ar" : "en"] || inferred.governorateCode
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{inferred.error || t("invalidNid")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("fullNameAr")}
                    </label>
                    <input
                      type="text"
                      value={fullNameAr}
                      onChange={(e) => setFullNameAr(e.target.value)}
                      placeholder="أحمد محمود حسن إبراهيم"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("fullNameEn")}
                    </label>
                    <input
                      type="text"
                      value={fullNameEn}
                      onChange={(e) => setFullNameEn(e.target.value)}
                      placeholder="Ahmed Mahmoud Hassan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                </div>

                {/* Phone & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("phone")}
                    </label>
                    <input
                      type="tel"
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="01012345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("password")}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                </div>

                {/* Governorate Confirmation / Override */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("governorateConfirm")}
                  </label>
                  <select
                    value={governorateId}
                    onChange={(e) => setGovernorateId(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-input bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    required
                  >
                    <option value="">{locale === "ar" ? "اختر المحافظة..." : "Select Governorate..."}</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {locale === "ar" ? g.nameAr : g.nameEn} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Checkboxes (Disability & Pregnancy) */}
                <div className="pt-2 space-y-2.5 border-t border-border">
                  <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={hasDisability}
                      onChange={(e) => setHasDisability(e.target.checked)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary/30 cursor-pointer"
                    />
                    <span>{t("hasDisability")}</span>
                  </label>

                  {inferred.gender === "FEMALE" && (
                    <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={isPregnant}
                        onChange={(e) => setIsPregnant(e.target.checked)}
                        className="w-4 h-4 rounded border-input text-primary focus:ring-primary/30 cursor-pointer"
                      />
                      <span>{t("isPregnant")}</span>
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inferred.isValid}
                  className="w-full py-3.5 min-h-[48px] rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-4 active:scale-[0.97]"
                >
                  <span>{locale === "ar" ? "متابعة وتأكيد رقم الهاتف" : "Continue to Mobile OTP"}</span>
                </button>
              </form>
            ) : (
              /* Step 2: Mock OTP Screen */
              <form onSubmit={handleCompleteRegistration} className="space-y-5">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">{t("otpTitle")}</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {t("otpSub")}
                  </p>
                  <span className="inline-block mt-2 font-mono font-bold text-primary text-xs bg-card px-3 py-1 rounded-full border border-border tabular-nums">
                    {phone}
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder={t("otpPlaceholder")}
                    className="w-full text-center tracking-[0.6em] font-mono text-3xl font-extrabold py-3.5 px-4 rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
                    required
                    autoFocus
                  />
                  <span className="text-[11px] text-muted-foreground text-center block mt-2">
                    {locale === "ar" ? "للتجربة السريعة: اكتب أي 6 أرقام مثل 123456" : "For demo testing: enter any 6 digits like 123456"}
                  </span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("FORM")}
                    className="w-1/3 py-3 min-h-[44px] rounded-full border border-border bg-card text-foreground text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer active:scale-95"
                  >
                    {tCommon("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || loading}
                    className="w-2/3 py-3 min-h-[44px] rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {loading ? tCommon("loading") : t("verifyOtp")}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link href="/login" className="font-bold text-primary hover:underline">
                  {tCommon("login")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
