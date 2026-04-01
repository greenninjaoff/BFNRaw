"use client";
import { trackEvent } from "@/lib/analytics";

import useCartStore from "@/stores/cartStore";
import useLangStore from "@/stores/langStore";
import { useT } from "@/i18n/t";
import { getVariantText } from "@/lib/productI18n";
import { ProductType } from "@/types";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ProductInteraction = ({ product }: { product: ProductType }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCartStore();
  const { lang } = useLangStore();
  const t = useT();

  const urlWeight = searchParams.get("weight") || "";
  const urlFlavor = searchParams.get("flavor") || "";

  const defaultFlavor = product.variants.find((v) => v.flavorKey)?.flavorKey || product.variants[0]?.flavorKey || "";

  const allFlavorKeys = useMemo(() => {
    const keys = new Set<string>();
    product.variants.forEach((v) => { if (v.flavorKey) keys.add(v.flavorKey); });
    return Array.from(keys);
  }, [product.variants]);

  const flavorToWeights = useMemo(() => {
    const map = new Map<string, string[]>();
    product.variants.forEach((v) => {
      if (!v.flavorKey || !v.netWeight) return;
      const arr = map.get(v.flavorKey) || [];
      if (!arr.includes(v.netWeight)) arr.push(v.netWeight);
      map.set(v.flavorKey, arr);
    });
    return map;
  }, [product.variants]);

  const selectedFlavorKey = allFlavorKeys.includes(urlFlavor) ? urlFlavor : defaultFlavor;
  const allowedWeights = selectedFlavorKey && flavorToWeights.has(selectedFlavorKey)
    ? flavorToWeights.get(selectedFlavorKey) || []
    : product.netWeightOptions;
  const selectedWeight = allowedWeights.includes(urlWeight) ? urlWeight : allowedWeights[0] || "";

  const selectedVariant = useMemo(() => {
    return product.variants.find((v) =>
      (v.flavorKey ? v.flavorKey === selectedFlavorKey : true) &&
      (v.netWeight ? v.netWeight === selectedWeight : true)
    ) || product.variants.find((v) => v.flavorKey === selectedFlavorKey)
      || product.variants.find((v) => v.netWeight === selectedWeight)
      || product.variants[0];
  }, [product.variants, selectedFlavorKey, selectedWeight]);

  const setParam = (key: "weight" | "flavor", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setFlavor = (newFlavor: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("flavor", newFlavor);
    const allowed = flavorToWeights.get(newFlavor) || product.netWeightOptions;
    if (allowed.length > 0 && !allowed.includes(params.get("weight") || "")) {
      params.set("weight", allowed[0]);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const cartItem = useMemo(() => {
    if (!selectedVariant) return undefined;
    return cart.find((c) => c.productId === product.id && c.sku === selectedVariant.sku);
  }, [cart, product.id, selectedVariant]);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    const { name } = getVariantText(product as any, selectedVariant as any, lang);
    if (cartItem) {
      updateQuantity({ productId: product.id, sku: selectedVariant.sku }, cartItem.quantity + 1);
      return;
    }
    trackEvent("ADD_TO_CART", { productId: String(product.id) });
    addToCart({
      productId: product.id,
      sku: selectedVariant.sku,
      flavorId: (selectedVariant as any)._flavorId || selectedVariant.sku,
      quantity: 1,
      name,
      price: Number(selectedVariant.price ?? 0),
      image: selectedVariant.image,
      netWeight: selectedVariant.netWeight || selectedWeight,
      flavorKey: selectedVariant.flavorKey,
      category: product.category,
      type: product.type,
      series: product.series,
    });
  };

  const inc = () => {
    if (!selectedVariant) return;
    const qty = cartItem?.quantity ?? 0;
    if (qty <= 0) { handleAddToCart(); return; }
    // Don't exceed available stock
    if (Number(selectedVariant.stock) > 0 && qty >= Number(selectedVariant.stock)) return;
    updateQuantity({ productId: product.id, sku: selectedVariant.sku }, qty + 1);
  };

  const dec = () => {
    if (!selectedVariant) return;
    const qty = cartItem?.quantity ?? 0;
    if (qty <= 1) { removeFromCart({ productId: product.id, sku: selectedVariant.sku }); return; }
    updateQuantity({ productId: product.id, sku: selectedVariant.sku }, qty - 1);
  };

  const [pressed, setPressed] = useState<null | "add" | "inc" | "dec">(null);
  useEffect(() => {
    if (!pressed) return;
    const tm = setTimeout(() => setPressed(null), 140);
    return () => clearTimeout(tm);
  }, [pressed]);

  const flashOn = "!bg-[rgb(var(--btn-bg-hover))] !text-[rgb(var(--btn-text))]";

  return (
    <div className="flex flex-col gap-4 mt-4">
      {product.netWeightOptions.length > 0 && (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-[rgb(var(--muted))]">{t("common.netWeight")}</span>
          <div className="flex items-center gap-2 flex-wrap">
            {product.netWeightOptions.map((w) => {
              const disabled = allowedWeights.length > 0 && !allowedWeights.includes(w);
              return (
                <button type="button" key={w} disabled={disabled} onClick={() => !disabled && setParam("weight", w)}
                  className={`px-3 py-2 rounded-md ring-1 transition-colors duration-200 ${
                    selectedWeight === w
                      ? "bg-[rgb(var(--btn-bg))] hover:bg-[rgb(var(--btn-bg-hover))] text-[rgb(var(--btn-text))] ring-transparent"
                      : disabled
                        ? "bg-[rgb(var(--surface))] text-[rgb(var(--muted))] ring-[rgb(var(--surface))] cursor-not-allowed"
                        : "bg-transparent text-[rgb(var(--text))] ring-[rgb(var(--border))] hover:bg-[rgb(var(--btn-bg-hover)/0.15)]"
                  }`}>
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allFlavorKeys.length > 0 && (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-[rgb(var(--muted))]">{t("common.flavor")}</span>
          <div className="flex items-center gap-2 flex-wrap">
            {allFlavorKeys.map((key) => {
              const v = product.variants.find((x) => x.flavorKey === key);
              const img = v?.image;
              return (
                <button type="button" key={key} onClick={() => setFlavor(key)}
                  className={`border p-[2px] rounded-md transition-colors duration-200 ${
                    selectedFlavorKey === key ? "border-[rgb(var(--btn-bg))]" : "border-[rgb(var(--border))] hover:border-[rgb(var(--btn-bg-hover))]"
                  }`} title={key.replaceAll("_", " ")}>
                  {img ? (
                    <Image src={img} alt={key} width={80} height={60} className="object-cover rounded" />
                  ) : (
                    <div className="w-20 h-14 flex items-center justify-center text-xs text-[rgb(var(--muted))] border rounded">{key}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedVariant && Number(selectedVariant.stock) <= 0 ? (
        <button type="button" disabled
          className="px-4 py-2 rounded-md shadow-lg flex items-center justify-center gap-2 text-sm font-medium bg-[rgb(var(--surface))] text-[rgb(var(--muted))] cursor-not-allowed opacity-70">
          {t("product.outOfStock")}
        </button>
      ) : !cartItem ? (
        <button type="button" onClick={() => { setPressed("add"); handleAddToCart(); }}
          className={`px-4 py-2 rounded-md shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm font-medium transition-colors duration-200 active:scale-95 bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] hover:bg-[rgb(var(--btn-bg-hover))] ${pressed === "add" ? flashOn : ""}`}>
          <ShoppingCart className="w-4 h-4" />
          {t("common.addToCart")}
        </button>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-[rgb(var(--muted))]">{t("common.quantity")}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setPressed("dec"); dec(); }}
              className={`w-8 h-8 flex items-center justify-center ring-1 shadow-lg rounded-md cursor-pointer text-sm transition-colors duration-200 active:scale-95 ring-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] hover:!bg-[rgb(var(--btn-bg-hover))] hover:!text-[rgb(var(--btn-text))] ${pressed === "dec" ? flashOn : ""}`}>
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-[rgb(var(--text))]">{cartItem.quantity}</span>
            <button type="button" onClick={() => { setPressed("inc"); inc(); }}
              className={`w-8 h-8 flex items-center justify-center ring-1 shadow-lg rounded-md cursor-pointer text-sm transition-colors duration-200 active:scale-95 ring-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] hover:!bg-[rgb(var(--btn-bg-hover))] hover:!text-[rgb(var(--btn-text))] ${pressed === "inc" ? flashOn : ""}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInteraction;
