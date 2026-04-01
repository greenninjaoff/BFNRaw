"use client";

import { useState } from "react";
import useAdminLangStore from "@/stores/adminLangStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Pencil } from "lucide-react";
import VariantForm, { buildI18nFromFlat, flatFromI18n } from "./VariantForm";
import { resolveStoredImage } from "./ImageUpload";

type Props = { product: any; categories: any[]; onClose: () => void; onSaved: () => void; };

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition";

export default function EditProductSheet({ product, categories, onClose, onSaved }: Props) {
  const { t } = useAdminLangStore();
  const [addVariantError, setAddVariantError] = useState("");
  const [editVariantError, setEditVariantError] = useState("");
  const [name, setName] = useState(product.name || "");
  const [categoryId, setCategoryId] = useState(product.categoryId || "");
  const [type, setType] = useState(product.type || "");
  const [series, setSeries] = useState(product.series || "");
  const [description, setDescription] = useState(product.description || "");
  const [isActive, setIsActive] = useState(product.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [editVariantId, setEditVariantId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState<any>({ sku: "", flavorKey: "", flavorName: "", netWeight: "", price: "", costPrice: "0", stock: "0", imageUrl: "", isActive: true });
  const [editVariantData, setEditVariantData] = useState<any>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await adminApi.updateProduct(product.id, {
        name, categoryId, type: type || undefined, series: series || undefined,
        description: description || undefined, isActive,
      });
      onSaved(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleAddVariant = async () => {
    if (!newVariant.sku || !newVariant.price) { setAddVariantError(t("products.skuPriceRequired")); return; }
    try {
      await adminApi.createFlavor(product.id, {
        sku: newVariant.sku, flavorKey: newVariant.flavorKey, flavorName: newVariant.flavorName || undefined,
        netWeight: newVariant.netWeight || undefined, price: Number(newVariant.price),
        stock: Number(newVariant.stock), imageUrl: newVariant.imageUrl || undefined,
        isActive: newVariant.isActive, i18n: buildI18nFromFlat(newVariant),
      });
      setNewVariant({ sku: "", flavorKey: "", flavorName: "", netWeight: "", price: "", costPrice: "0", stock: "0", imageUrl: "", isActive: true });
      setShowAddVariant(false);
      onSaved();
    setAddVariantError("");
    } catch (err: any) { setAddVariantError(err.message); }
  };

  const handleSaveVariant = async (flavorId: string) => {
    try {
      await adminApi.updateFlavor(product.id, flavorId, {
        ...editVariantData,
        price: editVariantData.price !== undefined ? Number(editVariantData.price) : undefined,
        stock: editVariantData.stock !== undefined ? Number(editVariantData.stock) : undefined,
        costPrice: editVariantData.costPrice !== undefined ? Number(editVariantData.costPrice) : undefined,
        imageUrl: editVariantData.imageUrl || undefined,
        i18n: buildI18nFromFlat(editVariantData),
      });
      setEditVariantId(null);
      onSaved();
    } catch (err: any) { setEditVariantError(err.message); }
  };

  const handleDeleteFlavor = async (flavorId: string, label: string) => {
    if (!window.confirm(`${t("common.delete")} "${label}"?`)) return;
    try { await adminApi.deleteFlavor(product.id, flavorId); onSaved(); }
    catch (err: any) { setAddVariantError(err.message); }
  };

  const variants = (product.variants || []).filter(Boolean);

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl pl-6">
        <SheetHeader><SheetTitle className="text-sm">{t("common.edit")}: {product.name}</SheetTitle></SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)] mt-4">
          <div className="pr-4 pb-6 space-y-5">
            {/* Product form */}
            <form onSubmit={handleSave}>
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("products.info")}</p>
                {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                    <input value={type} onChange={(e) => setType(e.target.value)} className={inputCls} placeholder="Protein Powder" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Series</label>
                    <input value={series} onChange={(e) => setSeries(e.target.value)} className={inputCls} placeholder="Sachet" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    rows={2} className={`${inputCls} resize-none`} />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
                  {t("common.active")}
                </label>
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t("common.cancel")}</Button>
                  <Button type="submit" disabled={saving} className="flex-1">{saving ? t("common.loading") : t("common.save")}</Button>
                </div>
              </div>
            </form>

            {/* Variants list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("products.variants")} ({variants.length})
                </p>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => { setShowAddVariant(!showAddVariant); setEditVariantId(null); }}
                  className="gap-1 h-7 text-xs">
                  <Plus className="w-3 h-3" /> {t("common.add")}
                </Button>
              </div>

              {addVariantError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 mb-2">{addVariantError}</div>}
              {showAddVariant && (
                <div className="mb-4">
                  <VariantForm
                    title={t("products.newVariant")}
                    values={newVariant}
                    onChange={(k, v) => setNewVariant((p: any) => ({ ...p, [k]: v }))}
                    onRemove={() => setShowAddVariant(false)}
                  />
                  <Button type="button" onClick={handleAddVariant} className="mt-3 w-full" size="sm">
                    {t("products.addVariant")}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {variants.map((v: any) => (
                  editVariantId === v.id ? (
                    <div key={v.id}>
                      {editVariantError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 mb-2">{editVariantError}</div>}
                    <VariantForm
                        title={`${t("common.edit")}: ${v.flavorName || v.sku}`}
                        values={editVariantData}
                        onChange={(k, val) => setEditVariantData((p: any) => ({ ...p, [k]: val }))}
                        onRemove={() => setEditVariantId(null)}
                      />
                      <Button type="button" onClick={() => handleSaveVariant(v.id)} className="mt-3 w-full" size="sm">
                        {t("products.saveVariant")}
                      </Button>
                    </div>
                  ) : (
                    <div key={v.id} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${v.isActive ? "border-border bg-background" : "border-border/40 bg-muted/20 opacity-60"}`}>
                      {v.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveStoredImage(v.imageUrl) || v.imageUrl}
                          alt="" className="w-10 h-10 rounded-lg object-contain bg-muted border shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{v.flavorName || v.flavorKey || v.sku}</p>
                        <p className="text-xs text-muted-foreground">{v.netWeight} · {Number(v.price).toLocaleString("ru-RU")} sum · stock: {v.stock}</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60">{v.sku}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => {
                            setEditVariantId(v.id);
                            setEditVariantError("");
                            setShowAddVariant(false);
                            setEditVariantData({ ...v, price: String(v.price), stock: String(v.stock), costPrice: String(v.costPrice ?? 0), ...flatFromI18n(v.i18n) });
                          }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => handleDeleteFlavor(v.id, v.flavorName || v.sku)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
