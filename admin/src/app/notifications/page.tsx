"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, Send } from "lucide-react";
import useAdminLangStore from "@/stores/adminLangStore";

const NOTIF_TYPES = [
  { value: "INFO",   label: "Info",         color: "bg-blue-100 text-blue-700" },
  { value: "PROMO",  label: "Promo / Sale", color: "bg-yellow-100 text-yellow-700" },
  { value: "SYSTEM", label: "System",       color: "bg-muted text-muted-foreground" },
  { value: "ORDER",  label: "Order update", color: "bg-green-100 text-green-700" },
];

const inputCls = "w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition";

export default function NotificationsPage() {
  const { t } = useAdminLangStore();

  const [type, setType] = useState("INFO");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) { setError(t("notify.required")); return; }
    setSending(true); setError(""); setResult(null);
    try {
      const res = await adminApi.sendNotification({ type, title: title.trim(), message: message.trim() });
      setResult(res);
      setTitle(""); setMessage(""); setType("INFO");
    } catch (err: any) { setError(err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="py-4 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("notify.title")}</h1>
          <p className="text-sm text-muted-foreground">Send push-style notifications to all users</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="bg-card rounded-2xl border border-border p-5 space-y-4">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
        {result && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {t("notify.sent").replace("{n}", String(result.sent))}
          </div>
        )}

        {/* Type selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t("notify.type")}</label>
          <div className="flex flex-wrap gap-2">
            {NOTIF_TYPES.map((nt) => (
              <button key={nt.value} type="button" onClick={() => setType(nt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition ${
                  type === nt.value
                    ? `${nt.color} border-current`
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}>
                {nt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t("notify.notifTitle")} *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New promo available!"
            maxLength={100}
            required
            className={inputCls}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{title.length}/100</p>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t("notify.message")} *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Get 20% off on all protein products this weekend only!"
            rows={3}
            maxLength={500}
            required
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/500</p>
        </div>

        {/* Audience */}
        <div className="rounded-xl bg-muted/20 border border-border px-4 py-3 flex items-center gap-2 text-sm">
          <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">{t("notify.audience")}:</span>
          <span className="font-medium">{t("notify.allUsers")}</span>
        </div>

        <Button type="submit" disabled={sending} className="w-full gap-2">
          {sending
            ? <><span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />{t("common.loading")}</>
            : <><Send className="w-4 h-4" />{t("notify.send")}</>}
        </Button>
      </form>

      {/* Info box */}
      <div className="rounded-2xl bg-muted/20 border border-border p-4 space-y-2 text-sm">
        <p className="font-semibold text-muted-foreground">{t("notify.howItWorks")}</p>
        <ul className="space-y-1 text-muted-foreground text-xs list-disc list-inside">
          <li>{t("notify.hint1")}</li>
          <li>{t("notify.hint2")}</li>
          <li>{t("notify.hint3")}</li>
        </ul>
      </div>
    </div>
  );
}
