"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ImageUpload from "./ImageUpload";

export const LANGS = [
  { key: "ru", flag: "🇷🇺", label: "RU" },
  { key: "uz", flag: "🇺🇿", label: "UZ" },
  { key: "en", flag: "🇬🇧", label: "EN" },
];

export type I18nData = {
  [lang: string]: {
    name?: string;
    typeName?: string;
    flavorLabel?: string;
    description?: string;
    ingredients?: string;
  };
};

export function buildI18nFromFlat(flat: Record<string, string>): I18nData {
  const out: I18nData = {};
  for (const { key: lang } of LANGS) {
    const name        = flat[`${lang}_name`]        || "";
    const typeName    = flat[`${lang}_typeName`]    || "";
    const flavorLabel = flat[`${lang}_flavorLabel`] || "";
    const description = flat[`${lang}_description`] || "";
    const ingredients = flat[`${lang}_ingredients`] || "";
    if (name || typeName || flavorLabel || description || ingredients) {
      out[lang] = { name, typeName, flavorLabel, description, ingredients };
    }
  }
  return out;
}

export function flatFromI18n(i18n?: I18nData | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const { key: lang } of LANGS) {
    const v = i18n[lang] || {};
    out[`${lang}_name`]        = v.name        || "";
    out[`${lang}_typeName`]    = v.typeName    || "";
    out[`${lang}_flavorLabel`] = v.flavorLabel || "";
    out[`${lang}_description`] = v.description || "";
    out[`${lang}_ingredients`] = v.ingredients || "";
  }
  return out;
}

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition";

interface VariantFormProps {
  values: any;
  onChange: (k: string, v: any) => void;
  onRemove?: () => void;
  title?: string;
}

export default function VariantForm({ values, onChange, onRemove, title }: VariantFormProps) {
  const [showI18n, setShowI18n] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-muted/10 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
          {onRemove && (
            <button type="button" onClick={onRemove}
              className="text-xs text-destructive hover:underline">Remove</button>
          )}
        </div>
      )}
      <div className="p-4 space-y-4">
        {/* Core fields - 2 col grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">SKU *</label>
            <input value={values.sku || ""} onChange={(e) => onChange("sku", e.target.value)} required className={inputCls} placeholder="WPC-30G-COFFEE" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Flavor Key</label>
            <input value={values.flavorKey || ""} onChange={(e) => onChange("flavorKey", e.target.value)} className={inputCls} placeholder="Coffee_Latte" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Flavor Name</label>
            <input value={values.flavorName || ""} onChange={(e) => onChange("flavorName", e.target.value)} className={inputCls} placeholder="Coffee Latte" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Net Weight</label>
            <input value={values.netWeight || ""} onChange={(e) => onChange("netWeight", e.target.value)} className={inputCls} placeholder="700g" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (sum) *</label>
            <input type="number" value={values.price || ""} onChange={(e) => onChange("price", e.target.value)} required min="0" className={inputCls} placeholder="150000" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Cost Price (sum)
              {values.price && Number(values.costPrice) > 0 && (
                <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                  Margin: {Math.round(((Number(values.price) - Number(values.costPrice)) / Number(values.price)) * 100)}%
                  &nbsp;({(Number(values.price) - Number(values.costPrice)).toLocaleString("ru-RU")} sum profit)
                </span>
              )}
            </label>
            <input type="number" value={values.costPrice ?? "0"} onChange={(e) => onChange("costPrice", e.target.value)} min="0" className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Stock</label>
            <input type="number" value={values.stock ?? "0"} onChange={(e) => onChange("stock", e.target.value)} min="0" className={inputCls} />
          </div>
        </div>

        {/* Image upload */}
        <ImageUpload
          label="Variant image"
          value={values.imageUrl || ""}
          onChange={(url) => onChange("imageUrl", url)}
        />

        {/* Active toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={values.isActive ?? true} onChange={(e) => onChange("isActive", e.target.checked)} className="rounded" />
          Active
        </label>

        {/* i18n section */}
        <div>
          <button type="button" onClick={() => setShowI18n(!showI18n)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition py-1">
            {showI18n ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Translations (RU / UZ / EN)
          </button>

          {showI18n && (
            <div className="mt-3 space-y-4">
              {LANGS.map(({ key, flag, label: lbl }) => (
                <div key={key} className="rounded-xl border border-border bg-background p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{flag} {lbl}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Product name</label>
                      <input value={values[`${key}_name`] || ""} onChange={(e) => onChange(`${key}_name`, e.target.value)}
                        placeholder="Full product name" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Type name</label>
                      <input value={values[`${key}_typeName`] || ""} onChange={(e) => onChange(`${key}_typeName`, e.target.value)}
                        placeholder="Whey Protein Concentrate" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Flavor label</label>
                      <input value={values[`${key}_flavorLabel`] || ""} onChange={(e) => onChange(`${key}_flavorLabel`, e.target.value)}
                        placeholder="Coffee Latte" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Description</label>
                    <textarea value={values[`${key}_description`] || ""} onChange={(e) => onChange(`${key}_description`, e.target.value)}
                      rows={2} placeholder="Product description…" className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Ingredients</label>
                    <textarea value={values[`${key}_ingredients`] || ""} onChange={(e) => onChange(`${key}_ingredients`, e.target.value)}
                      rows={2} placeholder="Ingredients list…" className={`${inputCls} resize-none`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
