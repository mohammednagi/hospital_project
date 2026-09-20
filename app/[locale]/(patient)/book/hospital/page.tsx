"use client";

import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import {
  Building2,
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Check,
  Filter,
} from "lucide-react";

export default function BookHospitalPage({
  searchParams,
}: {
  searchParams: Promise<{ specialtyCode?: string }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const specialtyCode = resolvedSearchParams?.specialtyCode || "GP";

  const t = useTranslations("patient");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [governorates, setGovernorates] = useState<any[]>([]);
  const [selectedGovId, setSelectedGovId] = useState<string>("");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Governorates
  useEffect(() => {
    fetch("/api/governorates")
      .then((res) => res.json())
      .then((data) => {
        if (data.governorates) setGovernorates(data.governorates);
      })
      .catch((err) => console.error(err));
  }, []);

  // Load Hospitals sorted by proximity
  useEffect(() => {
    setLoading(true);
    let url = `/api/hospitals?specialtyCode=${specialtyCode}`;
    if (selectedGovId) {
      url += `&governorateId=${selectedGovId}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hospitals) setHospitals(data.hospitals);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [specialtyCode, selectedGovId]);

  const handleSelectHospital = (hosp: any) => {
    const clinic = hosp.clinics?.[0];
    const clinicId = clinic ? clinic.id : "";
    router.push(
      `/book/slot?hospitalId=${hosp.id}&specialtyCode=${specialtyCode}&clinicId=${clinicId}`
    );
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
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold">2</span>
          <span className="text-foreground">{t("step2Title")}</span>
          <span>/</span>
          <span>{isRtl ? "الموعد" : "Slot"}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {t("step2Title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("step2Sub")}
            </p>
          </div>

          {/* Governorate Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={selectedGovId}
              onChange={(e) => setSelectedGovId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-input bg-card text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">
                {isRtl ? "جميع المحافظات المتاحة" : "All Available Governorates"}
              </option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {isRtl ? g.nameAr : g.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Map-Free Proximity Sorted Hospital List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
            {tCommon("loading")}
          </div>
        ) : hospitals.length > 0 ? (
          <div className="space-y-3">
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-foreground">
                        {isRtl ? hosp.nameAr : hosp.nameEn}
                      </h3>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {hosp.type} • {isRtl ? hosp.governorate?.nameAr : hosp.governorate?.nameEn}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {hosp.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {hosp.phone}
                    </span>
                  </div>
                </div>

                {/* Distance Badge & Select Action */}
                <div className="flex items-center sm:flex-col items-end gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-bold border border-accent/30">
                    <Navigation className="w-3 h-3 text-accent" />
                    <span>
                      {hosp.distanceKm} {t("distance")}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectHospital(hosp)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isRtl ? "اختيار المستشفى" : "Select Hospital"}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-card border border-border text-center text-xs text-muted-foreground">
            {isRtl
              ? "لا توجد مستشفيات متاحة تقدم هذا التخصص في المحافظة المختارة حالياً."
              : "No hospitals offering this specialty found in selected governorate."}
          </div>
        )}
      </main>

      <MobileBottomBar />
    </div>
  );
}
