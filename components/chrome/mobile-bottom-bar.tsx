"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, CalendarPlus, ClipboardList, Bell } from "lucide-react";

export function MobileBottomBar() {
  const t = useTranslations("common");
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/book", label: t("book"), icon: CalendarPlus },
    { href: "/appointments", label: t("appointments"), icon: ClipboardList },
    { href: "/notifications", label: t("notifications"), icon: Bell },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 chrome-translucent shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-3 py-1.5 pb-safe">
      <div className="grid grid-cols-4 gap-1 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl text-[11px] font-semibold transition-transform active:scale-95 ${
                isActive ? "text-primary font-bold bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-primary stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
