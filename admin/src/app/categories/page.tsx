"use client";
import useAdminLangStore from "@/stores/adminLangStore";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

const inputCls = "rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary transition w-full";
const autoSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

type CatForm = { nameEn: string; nameRu: string; nameUz: string; slug: string };
const emptyForm = (): CatForm => ({ nameEn: "", nameRu: "", nameUz: "", slug: "" });

function CategoryForm({
  initial, onSave, onCancel, saving, t,
}: {
  initial: CatForm;
  onSave: (f: CatForm) => void;
  onCancel: () => void;
  saving: boolean;
  t: (k: string) => string;
}) {
  const [f, setF] = useState(initial);
  const set = (k: keyof CatForm, v: string) =>
    setF((p) => ({ ...p, [k]: v, ...(k === "nameEn" && !p.slug ? { slug: autoSlug(v) } : {}) }));

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/40 p-4 bg-primary/5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">🇬🇧 {t("categories.nameEn")} *</label>
          <input value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={inputCls} placeholder="Protein Bars" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">🇷🇺 {t("categories.nameRu")} *</label>
          <input value={f.nameRu} onChange={(e) => set("nameRu", e.target.value)} className={inputCls} placeholder="Протеиновые батончики" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">🇺🇿 {t("categories.nameUz")} *</label>
          <input value={f.nameUz} onChange={(e) => set("nameUz", e.target.value)} className={inputCls} placeholder="Protein barlar" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">{t("categories.slug")}</label>
          <input value={f.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} placeholder="protein-bars" />
          <p className="text-[10px] text-muted-foreground mt-0.5">{t("categories.slugHint")}</p>
        </div>
        <div className="flex gap-2 pb-0.5">
          <Button type="button" size="sm" disabled={saving || !f.nameEn || !f.nameRu || !f.nameUz}
            onClick={() => onSave(f)} className="gap-1">
            <Check className="w-3.5 h-3.5" />{saving ? "…" : t("common.save")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { t } = useAdminLangStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CatForm>(emptyForm());
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.getCategories().then(setCategories).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (f: CatForm) => {
    setSaving(true);
    try {
      await adminApi.createCategory({
        name: f.nameEn,
        nameEn: f.nameEn, nameRu: f.nameRu, nameUz: f.nameUz,
        slug: f.slug || autoSlug(f.nameEn), isActive: true,
      });
      setShowAdd(false); load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id: string, f: CatForm) => {
    setSaving(true);
    try {
      await adminApi.updateCategory(id, {
        name: f.nameEn, nameEn: f.nameEn, nameRu: f.nameRu, nameUz: f.nameUz,
        slug: f.slug || autoSlug(f.nameEn),
      });
      setEditId(null); load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`${t("common.delete")} "${name}"?`)) return;
    try { await adminApi.deleteCategory(id); load(); }
    catch (err: any) { setError(err.message); }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.categories")}</h1>
        <Button onClick={() => { setShowAdd(true); setEditId(null); }} className="gap-2" disabled={showAdd}>
          <Plus className="w-4 h-4" /> {t("common.add")}
        </Button>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">{error}</div>}

      {showAdd && (
        <CategoryForm
          initial={emptyForm()}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={saving}
          t={t}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" /></div>
      ) : (
        <div className="bg-primary-foreground rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">🇬🇧 EN</th>
              <th className="px-4 py-3 text-left font-medium">🇷🇺 RU</th>
              <th className="px-4 py-3 text-left font-medium">🇺🇿 UZ</th>
              <th className="px-4 py-3 text-left font-medium">{t("categories.slug")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("users.status")}</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/20">
                  {editId === cat.id ? (
                    <td colSpan={6} className="px-4 py-3">
                      <CategoryForm
                        initial={editForm}
                        onSave={(f) => handleUpdate(cat.id, f)}
                        onCancel={() => setEditId(null)}
                        saving={saving}
                        t={t}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{cat.nameEn || cat.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cat.nameRu || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cat.nameUz || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${cat.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {cat.isActive ? t("common.active") : t("common.inactive")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setEditId(cat.id);
                            setEditForm({ nameEn: cat.nameEn || cat.name || "", nameRu: cat.nameRu || "", nameUz: cat.nameUz || "", slug: cat.slug });
                            setShowAdd(false);
                          }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(cat.id, cat.nameEn || cat.name)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("categories.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
