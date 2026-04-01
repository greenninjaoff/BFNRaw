import { Lang } from "@/stores/langStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.png";
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

export type ApiVariant = {
  id: string;
  sku: string;
  flavorKey: string;
  flavorName: string | null;
  netWeight: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  i18n: Record<string, any> | null;
};

export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  type: string | null;
  series: string | null;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  categoryNameRu?: string | null;
  categoryNameUz?: string | null;
  categoryNameEn?: string | null;
  categorySlug: string;
  variants: ApiVariant[];
  createdAt?: string;
};

/** Get i18n text from a variant with language fallback chain */
export function getApiVariantText(variant: ApiVariant, lang: Lang) {
  const i18n = variant.i18n as Record<string, any> | null;
  // Language fallback: requested lang → en → ru → uz → empty
  const v = i18n?.[lang] ?? i18n?.["en"] ?? i18n?.["ru"] ?? i18n?.["uz"] ?? {};
  return {
    name:        (v.name        || variant.flavorName || variant.flavorKey || "") as string,
    typeName:    (v.typeName    || "") as string,
    flavorLabel: (v.flavorLabel || variant.flavorName || variant.flavorKey?.replaceAll("_", " ") || "") as string,
    description: (v.description || "") as string,
    ingredients: (v.ingredients || "") as string,
  };
}

/** Convert API product to the legacy ProductType shape */
export function apiProductToLegacy(p: ApiProduct) {
  return {
    id: p.id,
    baseName: p.name,
    category: p.categorySlug,
    type: p.type || "",
    series: p.series || "",
    netWeightOptions: [...new Set((p.variants || []).map((v) => v.netWeight).filter(Boolean))] as string[],
    variants: (p.variants || []).map((v) => ({
      sku: v.sku,
      flavorKey: v.flavorKey,
      netWeight: v.netWeight || undefined,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ?? null,
      stock: Number(v.stock ?? 0),
      isActive: v.isActive,
      image: resolveImageUrl(v.imageUrl),   // ← always resolved
      i18n: v.i18n || {},
      _flavorId: v.id,
    })),
  };
}
