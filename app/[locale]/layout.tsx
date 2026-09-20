import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import "../globals.css";

export const metadata = {
  title: "SmartGov Hospital | المستشفى الحكومي الذكي",
  description: "Bilingual Outpatient Clinic Booking & Queue Management Platform for Egyptian Public Hospitals",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
