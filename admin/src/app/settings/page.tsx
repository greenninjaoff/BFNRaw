"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import useAdminLangStore from "@/stores/adminLangStore";

const inputCls = "w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition";

export default function SettingsPage() {
  const { t } = useAdminLangStore();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getSettings()
      .then((s) => { setSettings(s); setValues(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true); setSaved(false);
    try {
      // Save delivery_fee only (service_fee removed from checkout)
      await adminApi.updateSettings({
        delivery_fee: values.delivery_fee || "9900",
      });
      setSettings({ ...values });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const hasChanges = values.delivery_fee !== settings.delivery_fee;

  const feeFields = [
    { key: "delivery_fee", label: t("settings.deliveryFee"), desc: "Applied to every order at checkout" },
  ];

  return (
    <div className="py-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t("settings.title")}</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
          {saved && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {t("settings.saved")}
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("settings.pricing")}</h2>
            {feeFields.map(({ key, label, desc }) => (
              <div key={key}>
                <label className="text-sm font-medium mb-1 block">{label}</label>
                <p className="text-xs text-muted-foreground mb-2">{desc}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0"
                    value={values[key] || ""}
                    onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
                    className={inputCls}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">sum</span>
                </div>
                {values[key] && (
                  <p className="text-xs text-muted-foreground mt-1">
                    = {Number(values[key]).toLocaleString("ru-RU")} sum
                  </p>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={saving || !hasChanges} className="w-full">
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </form>
      )}
    </div>
  );
}
