"use client";

import { resolveImage } from "@/lib/imageUtils";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddProductSheet from "@/components/AddProductSheet";
import EditProductSheet from "@/components/EditProductSheet";
import useAdminLangStore from "@/stores/adminLangStore";

export default function ProductsPage() {
  const { t } = useAdminLangStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.getProducts({ search: search || undefined }), adminApi.getCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search]);

  const toggle = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await adminApi.deleteProduct(id); load(); }
    catch (e: any) { setError(e.message); }
  };

  const handleDeleteFlavor = async (productId: string, flavorId: string, name: string) => {
    if (!window.confirm(`Delete variant "${name}"?`)) return;
    try { await adminApi.deleteFlavor(productId, flavorId); load(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("products.title")}</h1>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" /> {t("products.add")}
        </Button>
      </div>

      <input type="text" placeholder={t("common.search")} value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-xl border px-4 py-2 text-sm outline-none focus:border-primary bg-background" />

      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{t("common.noData")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const isOpen = expanded.has(product.id);
            const variants = (product.variants || []).filter(Boolean);
            // Pick representative image from first active variant (no product-level image)
            const thumbSrc = resolveImage(variants[0]?.imageUrl || null);

            return (
              <div key={product.id} className="bg-card rounded-2xl overflow-hidden border border-border">
                <div className="flex items-center gap-4 p-4">
                  {/* Variant image thumbnail or placeholder */}
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbSrc} alt={product.name} className="w-full h-full object-contain p-0.5"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{product.name}</p>
                      <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                        {product.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{product.categoryName}</span>
                      {product.type && <span className="text-xs text-muted-foreground">· {product.type}</span>}
                      {product.series && <span className="text-xs text-muted-foreground">· {product.series}</span>}
                      <span className="text-xs text-muted-foreground">· {variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct(product)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(product.id, product.name)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggle(product.id)}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border">
                    {variants.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">No variants yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-muted-foreground text-xs bg-muted/20">
                              <th className="px-3 py-2 text-left font-medium w-10"></th>
                              <th className="px-3 py-2 text-left font-medium">{t("products.sku")}</th>
                              <th className="px-3 py-2 text-left font-medium">{t("products.flavor")}</th>
                              <th className="px-3 py-2 text-left font-medium">{t("products.weight")}</th>
                              <th className="px-3 py-2 text-left font-medium">{t("products.price")}</th>
                              <th className="px-3 py-2 text-left font-medium">{t("products.costPrice")}</th>
                              <th className="px-3 py-2 text-left font-medium">{t("products.stock")}</th>
                              <th className="px-3 py-2 text-left font-medium">{t("common.actions")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((v: any) => {
                              const vImg = resolveImage(v.imageUrl);
                              return (
                                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                  <td className="px-3 py-2">
                                    <div className="w-8 h-8 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
                                      {vImg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={vImg} alt="" className="w-full h-full object-contain p-0.5"
                                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                      ) : <Package className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{v.sku}</td>
                                  <td className="px-3 py-2">{v.flavorName || v.flavorKey || "-"}</td>
                                  <td className="px-3 py-2">{v.netWeight || "-"}</td>
                                  <td className="px-3 py-2 font-medium">{Number(v.price).toLocaleString("ru-RU")}</td>
                                  <td className="px-3 py-2">
                                    {v.costPrice > 0 ? (
                                      <span className="text-xs">
                                        {Number(v.costPrice).toLocaleString("ru-RU")}
                                        <span className="ml-1 text-lime-500">
                                          {Math.round(((v.price - v.costPrice) / v.price) * 100)}%
                                        </span>
                                      </span>
                                    ) : <span className="text-muted-foreground/40">-</span>}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={v.stock <= 0 ? "text-red-500 font-semibold" : v.stock <= 5 ? "text-amber-500 font-medium" : ""}>{v.stock}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => setEditProduct({ ...product, _focusVariant: v.id })}>
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => handleDeleteFlavor(product.id, v.id, v.flavorName || v.sku)}>
                                        <Trash2 className="w-3 h-3 text-destructive" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddProductSheet open={showAdd} onClose={() => setShowAdd(false)} categories={categories} onSaved={load} />
      {editProduct && (
        <EditProductSheet product={editProduct} categories={categories} onClose={() => setEditProduct(null)} onSaved={load} />
      )}
    </div>
  );
}
