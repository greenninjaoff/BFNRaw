"use client";
import { fmtDate } from "@/lib/tz";
import useAdminLangStore from "@/stores/adminLangStore";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition";

const EMPTY = { code: "", discountType: "percent", discountValue: "", minOrderAmount: "", usageLimit: "", expiresAt: "", isActive: true };

function PromoForm({ initial, onSave, onClose, title }: { initial: any; onSave: (d: any) => Promise<void>; onClose: () => void; title: string }) {
  const { t } = useAdminLangStore();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await onSave({
        ...form,
        code: form.code.toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      onClose();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <SheetContent className="w-full sm:max-w-md">
      <SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>
      <ScrollArea className="h-[calc(100vh-80px)] mt-4">
        <form onSubmit={handleSave} className="space-y-4 pr-4 pb-8">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Code *</label>
            <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required className={inputCls} placeholder="SUMMER20" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Discount Type</label>
            <select value={form.discountType} onChange={(e) => set("discountType", e.target.value)} className={inputCls}>
              <option value="percent">{t("promo.percent")}</option>
              <option value="fixed">{t("promo.fixed")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Discount Value * {form.discountType === "percent" ? "(%)" : "(sum)"}
            </label>
            <input type="number" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} required min="0" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Minimum order amount (sum)</label>
            <input type="number" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="0" min="0" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Usage limit (blank = unlimited)</label>
            <input type="number" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="- " min="1" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Expires at (optional)</label>
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <button type="button" onClick={() => set("isActive", !form.isActive)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-all ${form.isActive ? "left-5" : "left-[2px]"}`} />
            </button>
            <span className="text-sm">Active</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </ScrollArea>
    </SheetContent>
  );
}

export default function PromoCodesPage() {
  const { t, lang } = useAdminLangStore();
  const [pageError, setPageError] = useState("");
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCode, setEditCode] = useState<any>(null);

  const load = () => {
    setLoading(true);
    adminApi.getPromoCodes().then(setCodes).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: any) => { await adminApi.createPromoCode(data); load(); };
  const handleUpdate = async (data: any) => { await adminApi.updatePromoCode(editCode.id, data); load(); };
  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Delete promo code "${code}"?`)) return;
    try { await adminApi.deletePromoCode(id); load(); } catch (e: any) { setPageError(e.message); }
  };
  const handleToggle = async (id: string, isActive: boolean) => {
    try { await adminApi.updatePromoCode(id, { isActive: !isActive }); load(); } catch (e: any) { setPageError(e.message); }
  };

  return (
    <div className="space-y-6 py-4">
      {pageError && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{pageError}</div>}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="w-4 h-4" /> Add code</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No promo codes yet. Create one above.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Discount</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Min order</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Usage</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Expires</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold">{code.code}</td>
                  <td className="px-4 py-3">
                    {code.discountType === "percent"
                      ? `${code.discountValue}%`
                      : `${Number(code.discountValue).toLocaleString("ru-RU")} sum`}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {code.minOrderAmount > 0 ? `${Number(code.minOrderAmount).toLocaleString("ru-RU")} sum` : "- "}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {code.usageCount}/{code.usageLimit ?? "∞"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {code.expiresAt ? fmtDate(code.expiresAt, lang) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={code.isActive ? "default" : "secondary"} className="text-[10px]">
                      {code.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(code.id, code.isActive)} title="Toggle active">
                        <Power className={`w-3.5 h-3.5 ${code.isActive ? "text-lime-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditCode(code)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(code.id, code.code)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={showAdd} onOpenChange={(v) => !v && setShowAdd(false)}>
        {showAdd && <PromoForm title="Add Promo Code" initial={EMPTY} onSave={handleCreate} onClose={() => setShowAdd(false)} />}
      </Sheet>
      <Sheet open={!!editCode} onOpenChange={(v) => !v && setEditCode(null)}>
        {editCode && (
          <PromoForm title={`Edit: ${editCode.code}`}
            initial={{ ...editCode, discountValue: String(editCode.discountValue), minOrderAmount: String(editCode.minOrderAmount || ""), usageLimit: String(editCode.usageLimit || ""), expiresAt: editCode.expiresAt ? new Date(editCode.expiresAt).toISOString().slice(0, 16) : "" }}
            onSave={handleUpdate} onClose={() => setEditCode(null)} />
        )}
      </Sheet>
    </div>
  );
}
