"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLocale}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-primary" />
      <span>{locale === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
