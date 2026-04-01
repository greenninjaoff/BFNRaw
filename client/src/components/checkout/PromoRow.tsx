"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { ChevronRight, Tag, CheckCircle } from "lucide-react";

const PromoRow = () => {
  const t = useT();
  const promoCode = useCheckoutStore((s) => s.promoCode);
  const promoDiscount = useCheckoutStore((s) => s.promoDiscount);
  const open = useCheckoutStore((s) => s.open);

  const isApplied = !!promoCode?.trim() && promoDiscount > 0;

  return (
    <button
      type="button"
      onClick={() => open("promo")}
      className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-[rgb(var(--surface))]"
    >
      <div className="flex items-center gap-3">
        {isApplied
          ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          : <Tag className="h-5 w-5 text-[rgb(var(--muted))] shrink-0" />}
        <div>
          <span className={`text-sm block ${isApplied ? "font-medium text-green-600" : "text-[rgb(var(--muted))]"}`}>
            {isApplied ? promoCode : t("checkout.promoCode")}
          </span>
          {isApplied && (
            <span className="text-xs text-green-500">
              -{promoDiscount.toLocaleString("ru-RU")} sum {t("checkout.discount").toLowerCase()}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[rgb(var(--muted))] shrink-0" />
    </button>
  );
};

export default PromoRow;
