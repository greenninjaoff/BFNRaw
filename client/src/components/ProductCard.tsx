"use client";

import { resolveImageUrl } from "@/lib/productUtils";
import useCartStore from "@/stores/cartStore";
import useLangStore from "@/stores/langStore";
import { useT } from "@/i18n/t";
import { getVariantText } from "@/lib/productI18n";
import { formatPrice } from "@/lib/formatPrice";
import { ProductType, ProductVariant } from "@/types";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ProductCard = ({
  product,
  variant,
}: {
  product: ProductType;
  variant: ProductVariant;
}) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCartStore();
  const { lang } = useLangStore();
  const t = useT();

  const { name, typeName, flavorLabel } = getVariantText(product as any, variant as any, lang);
  const fullName = [typeName, flavorLabel, variant.netWeight].filter(Boolean).join(", ");
  const price = Number(variant.price ?? 0);
  const compareAt = variant.compareAtPrice ? Number(variant.compareAtPrice) : null;
  const hasDiscount = compareAt !== null && compareAt > price;
  const isOutOfStock = (variant.stock ?? -1) === 0;
  const imageSrc = variant.image || "/placeholder.png";

  const cartItem = useMemo(
    () => cart.find((c) => c.productId === product.id && c.sku === variant.sku),
    [cart, product.id, variant.sku]
  );

  const [pressedKey, setPressedKey] = useState<null | "add" | "inc" | "dec">(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!pressedKey) return;
    const tm = setTimeout(() => setPressedKey(null), 140);
    return () => clearTimeout(tm);
  }, [pressedKey]);

  useEffect(() => {
    if (!justAdded) return;
    const tm = setTimeout(() => setJustAdded(false), 160);
    return () => clearTimeout(tm);
  }, [justAdded]);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      sku: variant.sku,
      flavorId: (variant as any)._flavorId || variant.sku,
      quantity: 1,
      name: fullName,
      price,
      image: variant.image,
      netWeight: variant.netWeight,
      flavorKey: variant.flavorKey,
      category: product.category,
      type: product.type,
      series: product.series,
      typeName,
      flavorLabel,
    });
  };

  const inc = () => {
    if (!cartItem) return;
    updateQuantity({ productId: product.id, sku: variant.sku }, cartItem.quantity + 1);
  };

  const dec = () => {
    if (!cartItem) return;
    if (cartItem.quantity <= 1) { removeFromCart({ productId: product.id, sku: variant.sku }); return; }
    updateQuantity({ productId: product.id, sku: variant.sku }, cartItem.quantity - 1);
  };

  const bottomInfo = [variant.netWeight || null, flavorLabel || null].filter(Boolean).join(" • ");
  const baseBtn = "transition-colors duration-200 active:scale-95 hover:!bg-[rgb(var(--btn-bg-hover))] hover:!text-[rgb(var(--btn-text))]";
  const flashOn = "!bg-[rgb(var(--btn-bg-hover))] !text-[rgb(var(--btn-text))]";

  // Use product.id as slug (API products use string id/slug)
  const productHref = `/products/${product.id}?flavor=${encodeURIComponent(variant.flavorKey || "")}&weight=${encodeURIComponent(variant.netWeight || "")}`;

  return (
    <div className="p-3">
      <div className="relative">
        <Link href={productHref} className="block">
          <div className="relative w-full aspect-[5/4]">
            <Image src={imageSrc} alt={fullName || name || "Product"} fill
              className="object-contain scale-110 bg-[rgb(var(--surface))] rounded-xl" />
          </div>
        </Link>

        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-[rgb(var(--surface))] text-[rgb(var(--muted))] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[rgb(var(--border))]">
            {t("product.outOfStock")}
          </div>
        )}
        <div className="absolute left-2 right-2 bottom-2 sm:left-auto sm:right-2 sm:w-[160px]">
          <div className="relative h-9">
            {/* + add button */}
            <button type="button" onClick={(e) => { e.preventDefault(); if (isOutOfStock) return; setPressedKey("add"); setJustAdded(true); handleAddToCart(); }}
              className={`absolute right-0 top-0 w-9 h-9 rounded-lg bg-[rgb(var(--card))] shadow-md text-[rgb(var(--text))] flex items-center justify-center ${baseBtn} ${pressedKey === "add" ? flashOn : ""} ${cartItem && !justAdded ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"}`}>
              <Plus className="w-4 h-4" />
            </button>

            {/* counter */}
            <div className={`absolute right-0 top-0 h-9 rounded-lg bg-[rgb(var(--card))] shadow-md text-[rgb(var(--text))] origin-right transition-all duration-200 ease-out ${cartItem ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 pointer-events-none"} w-full`}>
              <div className="h-full w-full flex items-center justify-between px-2">
                <button type="button" onClick={(e) => { e.preventDefault(); setPressedKey("dec"); dec(); }}
                  className={`w-8 h-8 rounded-lg bg-[rgb(var(--card))] text-[rgb(var(--text))] flex items-center justify-center ${baseBtn} ${pressedKey === "dec" ? flashOn : ""}`}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium tabular-nums">{cartItem?.quantity ?? 0}</span>
                <button type="button" onClick={(e) => { e.preventDefault(); setPressedKey("inc"); inc(); }}
                  className={`w-8 h-8 rounded-lg bg-[rgb(var(--card))] text-[rgb(var(--text))] flex items-center justify-center ${baseBtn} ${pressedKey === "inc" ? flashOn : ""}`}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-baseline gap-1.5">
          <p className="font-semibold text-xl text-[rgb(var(--text))]">{formatPrice(price)}</p>
          {hasDiscount && (
            <p className="text-xs text-[rgb(var(--muted))] line-through">{formatPrice(compareAt!)}</p>
          )}
        </div>
        <p className="mt-1 font-medium text-xs leading-snug line-clamp-2 text-[rgb(var(--text))]">{typeName || name || ""}</p>
        <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">{bottomInfo || ""}</p>
      </div>
    </div>
  );
};

export default ProductCard;
