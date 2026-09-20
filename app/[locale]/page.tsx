import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import { auth } from "@/lib/auth";
import {
  Calendar,
  ClipboardList,
  Stethoscope,
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("common");
  const tPatient = await getTranslations("patient");
  const tAuth = await getTranslations("auth");
  const tRoles = await getTranslations("roles");
  const session = await auth();

  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 bg-background">
      <TopNav user={session?.user as any} />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              {/* MoHP / UHIS Civic Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-accent/15 text-accent-foreground border border-accent/30 mb-6">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>{t("uhisBadge")}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                {t("portalName")}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                {isRtl
                  ? "منظومة رقمية ذكية لحجز مواعيد العيادات الخارجية بمستشفيات وزارة الصحة في كافة المحافظات، مع تنظيم فوري لطوابير الانتظار ودعم ذوي الهمم وكبار السن."
                  : "A smart digital platform for outpatient clinic appointments across Egyptian public hospitals, with queue management and prioritized care lanes."}
              </p>

              {/* Primary Call to Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
                <Link
                  href="/book"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[48px] rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
                >
                  <Calendar className="w-5 h-5" />
                  <span>{tPatient("bookNew")}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>

                <Link
                  href={session ? "/appointments" : "/login"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[48px] rounded-full border border-border bg-card text-foreground font-bold text-sm hover:bg-secondary transition-all cursor-pointer active:scale-95"
                >
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span>{session ? t("appointments") : t("login")}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards / System Actors */}
        <section className="py-12 bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
                {isRtl ? "منظومة متكاملة لخدمة جميع أطراف الرعاية الصحية" : "Integrated System for Healthcare Stakeholders"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRtl ? "اختر البوابة المناسبة للدور الوظيفي أو الخدمة المطلوبة:" : "Access the dedicated workspace for each role:"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* 1. Citizen */}
              <Link
                href="/book"
                className="p-5 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-sm transition-all flex flex-col group cursor-pointer active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-foreground">
                  {tRoles("PATIENT")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1 leading-relaxed">
                  {isRtl ? "حجز كشف، توجيه ذكي للأعراض، استلام تذكرة إلكترونية مع QR." : "Book visit, symptom routing, and instant QR ticket."}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <span>{isRtl ? "دخول بوابة المواطن" : "Citizen Portal"}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* 2. Reception */}
              <Link
                href="/reception/board"
                className="p-5 rounded-3xl bg-card border border-border hover:border-teal-500/50 hover:shadow-sm transition-all flex flex-col group cursor-pointer active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-foreground">
                  {tRoles("RECEPTION")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1 leading-relaxed">
                  {isRtl ? "شاشة الاستقبال، تسجيل حضور المرضى، حجز مباشر وتذاكر ورقية." : "Front desk board, check-ins, walk-in bookings."}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-800">
                  <span>{isRtl ? "شاشة الاستقبال" : "Front Desk"}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* 3. Doctor */}
              <Link
                href="/doctor/queue"
                className="p-5 rounded-3xl bg-card border border-border hover:border-cyan-500/50 hover:shadow-sm transition-all flex flex-col group cursor-pointer active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-foreground">
                  {tRoles("DOCTOR")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1 leading-relaxed">
                  {isRtl ? "طابور العيادة الذكي، نداء المرضى، كتابة موجز التشخيص." : "Clinic queue, calling next, diagnosis outcome note."}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-cyan-800">
                  <span>{isRtl ? "عيادة الطبيب" : "Doctor Clinic"}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* 4. Hospital Admin */}
              <Link
                href="/hospital-admin/clinics"
                className="p-5 rounded-3xl bg-card border border-border hover:border-amber-500/50 hover:shadow-sm transition-all flex flex-col group cursor-pointer active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-foreground">
                  {tRoles("HOSPITAL_ADMIN")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1 leading-relaxed">
                  {isRtl ? "إدارة العيادات والأطباء، توليد المواعيد، متابعة الإشغال." : "Manage clinics & doctors, generate 14-day slots."}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-800">
                  <span>{isRtl ? "إدارة المستشفى" : "Hospital Admin"}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* 5. Ministry */}
              <Link
                href="/ministry/dashboard"
                className="p-5 rounded-3xl bg-card border border-border hover:border-rose-500/50 hover:shadow-sm transition-all flex flex-col group cursor-pointer active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1 text-foreground">
                  {tRoles("MINISTRY_ADMIN")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1 leading-relaxed">
                  {isRtl ? "لوحة القيادة المركزية، مؤشرات الأداء، تصدير CSV للمحافظات." : "National command dashboard, KPI analytics, CSV export."}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-800">
                  <span>{isRtl ? "لوحة الوزارة" : "Ministry Command"}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Demo Credentials Quick Box */}
        <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                {tAuth("demoAccounts")}
              </h3>
              <span className="text-xs text-muted-foreground">
                (كلمة المرور لجميع الحسابات: <code className="bg-background px-2 py-0.5 rounded-full border border-border font-mono text-primary font-bold">GovEgypt@2026</code>)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-card border border-border shadow-2xs">
                <span className="font-bold block text-primary">{tRoles("PATIENT")}</span>
                <span className="text-muted-foreground block font-mono tabular-nums">29501010101234</span>
                <span className="text-[11px] font-semibold text-foreground">أحمد محمود إبراهيم</span>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border shadow-2xs">
                <span className="font-bold block text-teal-800">{tRoles("RECEPTION")}</span>
                <span className="text-muted-foreground block font-mono tabular-nums">28805050105678</span>
                <span className="text-[11px] font-semibold text-foreground">فاطمة حسن رضوان</span>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border shadow-2xs">
                <span className="font-bold block text-cyan-800">{tRoles("DOCTOR")}</span>
                <span className="text-muted-foreground block font-mono tabular-nums">28003030109012</span>
                <span className="text-[11px] font-semibold text-foreground">د. حازم عبد الله الجزار</span>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border shadow-2xs">
                <span className="font-bold block text-amber-800">{tRoles("HOSPITAL_ADMIN")}</span>
                <span className="text-muted-foreground block font-mono tabular-nums">27511110103456</span>
                <span className="text-[11px] font-semibold text-foreground">د. مروان فتحي البهنساوي</span>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border shadow-2xs">
                <span className="font-bold block text-rose-800">{tRoles("MINISTRY_ADMIN")}</span>
                <span className="text-muted-foreground block font-mono tabular-nums">27008080107890</span>
                <span className="text-[11px] font-semibold text-foreground">د. طارق شوقي عبد السلام</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MobileBottomBar />
    </div>
  );
}
