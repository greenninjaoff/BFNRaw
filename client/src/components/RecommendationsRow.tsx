"use client";

import ProductCard from "@/components/ProductCard";
import { ProductType, ProductVariant } from "@/types";
import { forwardRef } from "react";

type Props = {
  items: { product: ProductType; variant: ProductVariant }[];
};

const RecommendationsRow = forwardRef<HTMLDivElement, Props>(({ items }, ref) => {
  if (!items?.length) return null;

  return (
    <div
      ref={ref}
      className="overflow-x-auto no-scrollbar"
      style={{ overscrollBehaviorX: "contain", touchAction: "pan-x" }}
    >
      <div className="flex gap-3 w-max pb-2">
        {items.map(({ product, variant }) => (
          <div
            key={variant.sku}
            className="shrink-0 w-[220px] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]"
          >
            <ProductCard product={product} variant={variant} />
          </div>
        ))}
      </div>
    </div>
  );
});

RecommendationsRow.displayName = "RecommendationsRow";
export default RecommendationsRow;