"use client";
import { fmtDateTime } from "@/lib/tz";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { notificationsApi } from "@/lib/api";
import { useT } from "@/i18n/t";
import useLangStore from "@/stores/langStore";
import PageHeader from "@/components/PageHeader";
import { Bell, Package, Tag, Info, Settings, CheckCheck } from "lucide-react";

const TYPE_ICON: Record<string, React.ReactNode> = {
  INFO: <Info className="w-4 h-4" />,
  ORDER: <Package className="w-4 h-4" />,
  PROMO: <Tag className="w-4 h-4" />,
  SYSTEM: <Settings className="w-4 h-4" />,
};
const TYPE_COLOR: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-600",
  ORDER: "bg-[rgb(var(--surface))] text-[rgb(var(--btn-bg-hover))]",
  PROMO: "bg-yellow-100 text-yellow-600",
  SYSTEM: "bg-[rgb(var(--surface))] text-[rgb(var(--muted))]",
};

export default function NotificationsPage() {
  const t = useT();
  const { lang } = useLangStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    notificationsApi.getAll().then(setNotifications).catch(() => []).finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const unread = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    try { await notificationsApi.markRead(id); setNotifications((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n)); } catch {}
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try { await notificationsApi.markAllRead(); setNotifications((p) => p.map((n) => ({ ...n, isRead: true }))); }
    catch {} finally { setMarking(false); }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative">
        <PageHeader title={t("notifications.title")} backFallback="/"
          right={unread > 0 ? (
            <button onClick={handleMarkAll} disabled={marking} className="text-xs text-[rgb(var(--btn-bg-hover))] font-medium disabled:opacity-50">
              <CheckCheck className="w-4 h-4" />
            </button>
          ) : undefined} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-6 w-6 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--btn-bg))] animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-[rgb(var(--muted))] mx-auto mb-4 opacity-30" />
          <p className="text-[rgb(var(--muted))]">{t("notifications.none")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`rounded-2xl p-4 border transition cursor-pointer ${n.isRead ? "bg-[rgb(var(--card))] border-[rgb(var(--border))] opacity-60" : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:border-[rgb(var(--btn-bg))]"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLOR[n.type] || TYPE_COLOR.INFO}`}>
                  {TYPE_ICON[n.type] || TYPE_ICON.INFO}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[rgb(var(--btn-bg))] mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))] mt-1">{n.message}</p>
                  <p className="text-[10px] text-[rgb(var(--muted))]/60 mt-1.5">
                    {fmtDateTime(n.createdAt, lang)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
