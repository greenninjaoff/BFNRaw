"use client";

import { formatPrice } from "@/lib/formatPrice";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";

type CartItem = {
  productId: number | string;
  sku: string;
  quantity: number;
  name: string;
  price: number;
  image?: string | null;
  netWeight?: string | null;
  flavorLabel?: string | null;
  typeName?: string | null;
};

export default function CartStep1({
  t,
  cart,
  onInc,
  onDec,
}: {
  t: (key: string) => string;
  cart: CartItem[];
  onInc: (productId: number | string, sku: string, currentQty: number) => void;
  onDec: (productId: number | string, sku: string, currentQty: number) => void;
}) {
  if (!cart.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[rgb(var(--muted))]">{t("cart.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {cart.map((item, idx) => {
        const title = item.typeName || item.name || "";
        const info = [item.netWeight, item.flavorLabel].filter(Boolean).join(" • ");
        const img = item.image || "/placeholder.png";

        return (
          <div key={`${item.productId}-${item.sku}`}>
            <div className="flex items-center gap-4 py-4">
              <div className="relative w-16 h-16 bg-[rgb(var(--surface))] rounded-xl shrink-0 overflow-hidden">
                <Image src={img} alt={title || "Product"} fill className="object-contain p-1" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--text))] line-clamp-2 leading-snug">{title}</p>
                {info && <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{info}</p>}
                <p className="text-sm font-semibold text-[rgb(var(--text))] mt-1">{formatPrice(item.price)}</p>
              </div>

              <div className="flex items-center gap-0 bg-[rgb(var(--surface))] rounded-xl shrink-0">
                <button type="button" onClick={() => onDec(item.productId, item.sku, item.quantity)}
                  className="w-9 h-9 flex items-center justify-center text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] rounded-xl transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-[rgb(var(--text))] tabular-nums">
                  {item.quantity}
                </span>
                <button type="button" onClick={() => onInc(item.productId, item.sku, item.quantity)}
                  className="w-9 h-9 flex items-center justify-center text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] rounded-xl transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {idx < cart.length - 1 && <div className="h-px bg-[rgb(var(--border))]" />}
          </div>
        );
      })}
    </div>
  );
}
