import { Lang } from "@/stores/langStore";

export function pickLang<T extends Record<string, any>>(obj: T | undefined | null, lang: Lang) {
  return (obj?.[lang] ?? obj?.["en"] ?? obj?.["ru"] ?? obj?.["uz"]) as any;
}

export function getVariantText(
  product: { baseName?: string; type?: string; name?: string },
  variant: { i18n?: any; flavorKey?: string } | undefined,
  lang: Lang
) {
  const v = pickLang(variant?.i18n, lang);
  const vEn = variant?.i18n?.["en"];
  const baseName = product.baseName || product.name || "";

  return {
    name: v?.name || vEn?.name || baseName,
    description: v?.description || vEn?.description || "",
    ingredients: v?.ingredients || vEn?.ingredients || "",
    typeName: v?.typeName || vEn?.typeName || (product as any).type || baseName,
    flavorLabel: v?.flavorLabel || vEn?.flavorLabel || (variant?.flavorKey ? variant.flavorKey.replaceAll("_", " ") : ""),
  };
}
