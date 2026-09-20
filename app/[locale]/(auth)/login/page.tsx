"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { TopNav } from "@/components/chrome/top-nav";
import { Building2, ShieldCheck, Lock, AlertCircle, LogIn, Sparkles } from "lucide-react";

const DEMO_USERS = [
  { role: "PATIENT", nameAr: "مواطن (أحمد محمود)", nameEn: "Citizen (Ahmed Mahmoud)", nid: "29501010101234", roleKey: "PATIENT" },
  { role: "RECEPTION", nameAr: "استقبال (فاطمة حسن)", nameEn: "Reception (Fatma Hassan)", nid: "28805050105678", roleKey: "RECEPTION" },
  { role: "DOCTOR", nameAr: "طبيب (د. حازم الجزار)", nameEn: "Doctor (Dr. Hazem El-Gazzar)", nid: "28003030109012", roleKey: "DOCTOR" },
  { role: "HOSPITAL_ADMIN", nameAr: "مدير مستشفى (د. مروان)", nameEn: "Hospital Admin (Dr. Marwan)", nid: "27511110103456", roleKey: "HOSPITAL_ADMIN" },
  { role: "MINISTRY_ADMIN", nameAr: "مشرف وزارة (د. طارق)", nameEn: "Ministry Admin (Dr. Tarek)", nid: "27008080107890", roleKey: "MINISTRY_ADMIN" },
];

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const router = useRouter();

  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        nationalId,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(locale === "ar" ? "بيانات الدخول غير صحيحة. يرجى التأكد من الرقم القومي وكلمة المرور." : "Invalid credentials. Please check your National ID and password.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleQuickFill = (nid: string) => {
    setNationalId(nid);
    setPassword("GovEgypt@2026");
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav user={null} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t("loginTitle")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("loginSub")}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("nationalId")}
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
                  placeholder="29501010101234"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground font-mono text-base focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
                  required
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  {locale === "ar" ? "14 رقماً قومياً من بطاقة الرقم القومي المصرية" : "14 digits as shown on Egyptian National ID card"}
                </span>
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
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 min-h-[48px] rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.97]"
              >
                {loading ? (
                  <span>{tCommon("loading")}</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{tCommon("login")}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "ليس لديك حساب مواطن؟" : "Don't have an account?"}{" "}
                <Link href="/register" className="font-bold text-primary hover:underline">
                  {tCommon("register")}
                </Link>
              </p>
            </div>

            {/* Quick Demo Credentials Switcher */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{t("demoAccounts")}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {DEMO_USERS.map((du) => (
                  <button
                    key={du.role}
                    type="button"
                    onClick={() => handleQuickFill(du.nid)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-border bg-secondary/40 hover:bg-secondary text-xs text-start flex items-center justify-between transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <div>
                      <span className="font-bold block text-foreground">
                        {locale === "ar" ? du.nameAr : du.nameEn}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {du.nid}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {locale === "ar" ? "تعبئة سريعة" : "Auto-fill"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
