"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice } from "@/lib/formatPrice";
import { Truck } from "lucide-react";

const DeliveryTypePill = () => {
  const t = useT();
  const deliveryType = useCheckoutStore((s) => s.deliveryType);
  const setDeliveryType = useCheckoutStore((s) => s.setDeliveryType);
  const { deliveryFee } = useSettings();

  return (
    <div className="flex gap-3">
      {/* Standard */}
      <button
        type="button"
        onClick={() => setDeliveryType("standard")}
        className={`flex-1 flex flex-col gap-1 p-4 rounded-2xl border-2 text-left transition-all ${
          deliveryType === "standard"
            ? "border-[rgb(var(--btn-bg))] bg-[rgb(var(--surface))]"
            : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--muted))]"
        }`}
      >
        <div className="flex items-center gap-2">
          <Truck className={`w-4 h-4 ${deliveryType === "standard" ? "text-[rgb(var(--btn-bg-hover))]" : "text-[rgb(var(--muted))]"}`} />
          <span className={`text-sm font-semibold ${deliveryType === "standard" ? "text-[rgb(var(--text))]" : "text-[rgb(var(--muted))]"}`}>
            {t("checkout.standard")}
          </span>
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">50–60 min</p>
        <p className={`text-xs font-medium ${deliveryType === "standard" ? "text-[rgb(var(--btn-bg-hover))]" : "text-[rgb(var(--muted))]"}`}>
          {formatPrice(deliveryFee)}
        </p>
      </button>
    </div>
  );
};

export default DeliveryTypePill;
