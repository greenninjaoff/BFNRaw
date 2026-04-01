"use client";
import { trackEvent } from "@/lib/analytics";
import { resolveImageUrl } from "@/lib/productUtils";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import useLangStore from "@/stores/langStore";
import { useT } from "@/i18n/t";
import { formatPrice } from "@/lib/formatPrice";
import { ApiProduct, getApiVariantText, apiProductToLegacy } from "@/lib/productUtils";
import { productsApi } from "@/lib/api";
import ProductInteraction from "@/components/ProductInteraction";
import BackButton from "@/components/BackButton";


function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row md:gap-12 mt-6 animate-pulse">
      <div className="w-full lg:w-5/12 aspect-[2/3] rounded-2xl bg-[rgb(var(--surface))]" />
      <div className="w-full lg:w-7/12 flex flex-col gap-4 pt-2">
        <div className="h-7 w-3/4 rounded bg-[rgb(var(--surface))]" />
        <div className="h-4 w-full rounded bg-[rgb(var(--surface))]" />
        <div className="h-8 w-1/3 rounded bg-[rgb(var(--surface))]" />
      </div>
    </div>
  );
}

function ProductDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { lang } = useLangStore();
  const t = useT();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true); setErrorState(false);
    productsApi.getOne(id)
      .then((p) => { if (!p) { setErrorState(true); return; } setProduct(p); trackEvent("PRODUCT_VIEW", { productId: p.id }); })
      .catch(() => setErrorState(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ProductSkeleton />;
  if (errorState || !product) return notFound();

  const urlFlavor = searchParams.get("flavor") || "";
  const urlWeight = searchParams.get("weight") || "";
  const variants = (product.variants || []).filter((v) => v.isActive);
  const sv = variants.find((v) => v.flavorKey === urlFlavor && v.netWeight === urlWeight)
    || variants.find((v) => v.flavorKey === urlFlavor)
    || variants.find((v) => v.netWeight === urlWeight)
    || variants[0];

  if (!sv && variants.length === 0) return notFound();

  const variantToDisplay = sv || variants[0];
  const { name, description, typeName, ingredients } = getApiVariantText(variantToDisplay, lang);
  const displayName = name || typeName || product.name;
  const price = Number(variantToDisplay?.price || 0);
  const compareAt = variantToDisplay?.compareAtPrice ? Number(variantToDisplay.compareAtPrice) : null;
  const hasDiscount = compareAt !== null && compareAt > price;
  const imageSrc = resolveImageUrl(variantToDisplay?.imageUrl || product.imageUrl);
  const legacyProduct = apiProductToLegacy(product) as any;

  // Fall back to product-level description if variant has none
  const displayDescription = description || product.description || "";

  return (
    <div className="mt-4 lg:mt-8">
      <div className="mb-6"><BackButton fallback="/products" /></div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        {/* Image */}
        <div className="w-full lg:w-5/12 relative aspect-[3/4]">
          <Image
            src={imageSrc}
            alt={displayName}
            fill
            className="object-contain rounded-2xl bg-[rgb(var(--surface))]"
          />
        </div>

        {/* Info */}
        <div className="w-full lg:w-7/12 flex flex-col gap-4">
          <div>
            {typeName && typeName !== displayName && (
              <p className="text-xs font-medium text-[rgb(var(--muted))] uppercase tracking-wider mb-1">{typeName}</p>
            )}
            <h1 className="text-2xl font-bold text-[rgb(var(--text))]">{displayName}</h1>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[rgb(var(--text))]">{formatPrice(price)}</p>
            {hasDiscount && (
              <p className="text-sm text-[rgb(var(--muted))] line-through">{formatPrice(compareAt!)}</p>
            )}
          </div>
          {variants.length > 0 && <ProductInteraction product={legacyProduct} />}
        </div>
      </div>

      {/* Description + Ingredients sections below the image/interaction */}
      {(displayDescription || ingredients) && (
        <div className="mt-8 space-y-4 max-w-2xl">
          {displayDescription && (
            <div className="rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-5">
              <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-3">{t("product.description")}</h2>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed whitespace-pre-line">{displayDescription}</p>
            </div>
          )}
          {ingredients && (
            <div className="rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-5">
              <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-3">{t("product.ingredients")}</h2>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed whitespace-pre-line">{ingredients}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4 animate-pulse mt-6"><div className="h-96 rounded-2xl bg-[rgb(var(--surface))]" /></div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
