"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { ChevronDown, ChevronUp } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import Image from "next/image";
import { useState } from "react";

const fmt = (v: number) => `${v.toLocaleString("ru-RU")} sum`;

const PriceDetails = () => {
  const t = useT();
  const itemsTotal = useCheckoutStore((s) => s.itemsTotal);
  const deliveryFee = useCheckoutStore((s) => s.deliveryFee);
  const total = useCheckoutStore((s) => s.total);
  const promoDiscount = useCheckoutStore((s) => s.promoDiscount);
  const promoCode = useCheckoutStore((s) => s.promoCode);
  const { cart } = useCartStore();
  const [showItems, setShowItems] = useState(false);

  return (
    <div className="px-4 py-5">
      <h2 className="mb-4 text-xl font-bold text-[rgb(var(--text))]">{t("checkout.priceDetails")}</h2>
      <div className="space-y-0">
        {/* Items total - expandable */}
        <button type="button" onClick={() => setShowItems(!showItems)}
          className="flex items-center justify-between w-full py-3 border-b border-[rgb(var(--border))]">
          <span className="flex items-center gap-1.5 text-sm text-[rgb(var(--text))]">
            {t("checkout.itemsTotal")}
            {showItems ? <ChevronUp className="w-3.5 h-3.5 text-[rgb(var(--muted))]" /> : <ChevronDown className="w-3.5 h-3.5 text-[rgb(var(--muted))]" />}
          </span>
          <span className="text-sm font-medium text-[rgb(var(--text))]">{fmt(itemsTotal)}</span>
        </button>

        {/* Expandable item list */}
        {showItems && cart.length > 0 && (
          <div className="py-2 space-y-3 border-b border-[rgb(var(--border))]">
            {cart.map((item: any) => (
              <div key={`${item.productId}-${item.sku}`} className="flex items-center gap-3 px-1">
                <div className="relative w-10 h-10 rounded-lg bg-[rgb(var(--surface))] shrink-0 overflow-hidden">
                  <Image src={item.image || "/placeholder.png"} alt={item.name || ""} fill className="object-contain p-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[rgb(var(--text))] truncate">{item.typeName || item.name}</p>
                  <p className="text-[10px] text-[rgb(var(--muted))]">{[item.netWeight, item.flavorLabel].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[rgb(var(--text))]">{fmt(item.price * item.quantity)}</p>
                  <p className="text-[10px] text-[rgb(var(--muted))]">×{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery - single fee, no type label */}
        <div className="flex items-center justify-between py-3 border-b border-[rgb(var(--border))]">
          <span className="text-sm text-[rgb(var(--text))]">{t("checkout.delivery")}</span>
          <span className="text-sm font-medium text-[rgb(var(--text))]">{fmt(deliveryFee)}</span>
        </div>

        {/* Promo discount - only show when applied */}
        {promoDiscount > 0 && (
          <div className="flex items-center justify-between py-3 border-b border-[rgb(var(--border))]">
            <span className="text-sm text-green-600 flex items-center gap-1.5">
              {t("checkout.discount")} {promoCode && <span className="text-xs font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{promoCode}</span>}
            </span>
            <span className="text-sm font-medium text-green-600">-{fmt(promoDiscount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-4">
          <span className="text-base font-bold text-[rgb(var(--text))]">{t("checkout.total")}</span>
          <span className="text-base font-bold text-[rgb(var(--text))]">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceDetails;
