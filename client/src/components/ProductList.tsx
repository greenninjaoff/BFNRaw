"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/i18n/t";
import useLangStore from "@/stores/langStore";
import useCartStore from "@/stores/cartStore";
import Categories from "./Categories";
import Filter from "./Filter";
import { useProducts } from "@/hooks/useProducts";
import { ApiProduct, ApiVariant, apiProductToLegacy, getApiVariantText, resolveImageUrl } from "@/lib/productUtils";
import ProductCard from "./ProductCard";
import { Package } from "lucide-react";

function Skeleton() {
  return (
    <div className="p-3 animate-pulse">
      <div className="w-full aspect-[5/4] rounded-xl bg-[rgb(var(--surface))]" />
      <div className="mt-2 h-4 w-20 rounded bg-[rgb(var(--surface))]" />
      <div className="mt-1 h-3 w-32 rounded bg-[rgb(var(--surface))]" />
    </div>
  );
}

const ProductList = ({ category, params }: { category?: string; params: "homepage" | "products" }) => {
  const t = useT();
  const searchParams = useSearchParams();
  const urlCategory = category || searchParams.get("category") || undefined;
  const urlSearch   = searchParams.get("search") || undefined;
  const urlSort     = searchParams.get("sort") || "newest";

  const { products, loading, error } = useProducts({
    category: urlCategory && urlCategory !== "all" ? urlCategory : undefined,
    search:   urlSearch,
    sort:     urlSort,
  });

  const listings = products.flatMap((product) =>
    (product.variants || []).filter((v) => v.isActive).map((variant) => ({
      product: apiProductToLegacy(product) as any,
      variant: {
        sku:          variant.sku,
        flavorKey:    variant.flavorKey,
        netWeight:    variant.netWeight || undefined,
        price:        Number(variant.price),
        compareAtPrice: variant.compareAtPrice ?? null,
        stock:        Number(variant.stock ?? 0),
        isActive:     variant.isActive,
        image:        resolveImageUrl(variant.imageUrl),
        i18n:         variant.i18n || {},
        _flavorId:    variant.id,
      },
    }))
  );

  const grid = "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-8 xl:gap-12 -mx-2 sm:mx-0";

  return (
    <div className="w-full">
      <Categories />
      {params === "products" && <Filter />}

      {loading && (
        <div className={grid}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="py-12 text-center text-[rgb(var(--muted))] text-sm">
          <p>{t("errors.general")}</p>
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="py-16 flex flex-col items-center gap-3 text-[rgb(var(--muted))]">
          <Package className="w-10 h-10 opacity-30" />
          <p className="text-sm">{t("filter.noResults")}</p>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div className={grid}>
          {listings.map(({ product, variant }) => (
            <ProductCard key={`${product.id}-${variant.sku}`} product={product} variant={variant} />
          ))}
        </div>
      )}

      {params === "homepage" && (
        <Link href={urlCategory ? `/products/?category=${urlCategory}` : "/products"}
          className="flex justify-end mt-4 underline text-sm text-[rgb(var(--muted))]">
          {t("common.viewAll")}
        </Link>
      )}
    </div>
  );
};

export default ProductList;
