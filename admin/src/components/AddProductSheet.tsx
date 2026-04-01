"use client";

import { useState } from "react";
import useAdminLangStore from "@/stores/adminLangStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import VariantForm, { buildI18nFromFlat } from "./VariantForm";

type Props = { open: boolean; onClose: () => void; categories: any[]; onSaved: () => void; };

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition";

const autoSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

function newVariant() {
  return { sku: "", flavorKey: "", flavorName: "", netWeight: "", price: "", costPrice: "0", stock: "0", imageUrl: "", isActive: true };
}

export default function AddProductSheet({ open, onClose, categories, onSaved }: Props) {
  const { t } = useAdminLangStore();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("");
  const [series, setSeries] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [variants, setVariants] = useState<any[]>([]);

  const addVariant = () => setVariants((p) => [...p, newVariant()]);
  const removeVariant = (i: number) => setVariants((p) => p.filter((_, j) => j !== i));
  const setVariant = (i: number, k: string, v: any) =>
    setVariants((p) => p.map((x, j) => j === i ? { ...x, [k]: v } : x));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t("products.nameRequired")); return; }
    if (!categoryId) { setError(t("products.categoryRequired")); return; }
    setError(""); setSaving(true);
    try {
      const product = await adminApi.createProduct({
        name, slug: slug || autoSlug(name), categoryId,
        type: type || undefined, series: series || undefined,
        description: description || undefined, isActive: true,
      });
      for (const v of variants) {
        if (!v.sku || !v.price) continue;
        await adminApi.createFlavor(product.id, {
          sku: v.sku, flavorKey: v.flavorKey, flavorName: v.flavorName || undefined,
          netWeight: v.netWeight || undefined, price: Number(v.price),
          costPrice: Number(v.costPrice ?? 0), stock: Number(v.stock), imageUrl: v.imageUrl || undefined,
          isActive: v.isActive,
          i18n: buildI18nFromFlat(v),
        });
      }
      // Reset
      setName(""); setSlug(""); setCategoryId(""); setType(""); setSeries(""); setDescription(""); setVariants([]);
      onSaved(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl pl-6">
        <SheetHeader><SheetTitle>{t("products.add")}</SheetTitle></SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)] mt-4">
          <form onSubmit={handleSave} className="pr-4 pb-6 space-y-5">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}

            {/* Product info */}
            <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("products.info")}</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                <input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }}
                  required className={inputCls} placeholder="Befit Whey Protein" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Slug</label>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputCls}>
                    <option value="">{t("common.select")}</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                  <input value={type} onChange={(e) => setType(e.target.value)} className={inputCls} placeholder="Protein Powder" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Series</label>
                  <input value={series} onChange={(e) => setSeries(e.target.value)} className={inputCls} placeholder="Sachet" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={2} placeholder="Short product description" className={`${inputCls} resize-none`} />
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("products.variants")} ({variants.length})
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1 h-7 text-xs">
                  <Plus className="w-3 h-3" /> {t("products.addVariant")}
                </Button>
              </div>
              <div className="space-y-4">
                {variants.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                    {t("products.noVariants")}
                  </p>
                )}
                {variants.map((v, i) => (
                  <VariantForm
                    key={i}
                    title={`Variant ${i + 1}`}
                    values={v}
                    onChange={(k, val) => setVariant(i, k, val)}
                    onRemove={() => removeVariant(i)}
                  />
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="sticky bottom-0 bg-background border-t pt-3 flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t("common.cancel")}</Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? t("common.loading") : t("products.saveProduct")}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
