import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopNav } from "@/components/chrome/top-nav";
import { MobileBottomBar } from "@/components/chrome/mobile-bottom-bar";
import { redirect } from "next/navigation";
import { Bell, MessageSquare, ShieldCheck, Mail } from "lucide-react";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const userId = (session.user as any).id;
  const tCommon = await getTranslations("common");
  const isRtl = locale === "ar";

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <TopNav user={session.user as any} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {tCommon("notifications")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isRtl ? "سجل الرسائل النصية والإشعارات الإدارية الخاصة بك" : "Your SMS logs and system alerts"}
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
            {notifications.length}
          </span>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {n.channel === "SMS_MOCK" ? (
                        <MessageSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <h3 className="font-bold text-sm text-foreground">
                      {n.title}
                    </h3>
                  </div>

                  <span className="text-[11px] text-muted-foreground font-mono">
                    {n.sentAt.toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed ps-9">
                  {n.body}
                </p>

                <div className="ps-9 pt-1 flex items-center gap-2">
                  <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                    {n.channel === "SMS_MOCK" ? (isRtl ? "رسالة نصية SMS (محاكاة)" : "SMS (Mocked)") : "In-App"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-card border border-border text-center text-xs text-muted-foreground">
            {isRtl ? "لا توجد إشعارات مسجلة حالياً." : "No notifications yet."}
          </div>
        )}
      </main>

      <MobileBottomBar />
    </div>
  );
}
