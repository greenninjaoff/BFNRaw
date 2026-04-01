"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { ChevronRight, MessageCircle } from "lucide-react";

const CourierInstructionsRow = () => {
  const t = useT();
  const courierInstructions = useCheckoutStore((s) => s.courierInstructions);
  const open = useCheckoutStore((s) => s.open);

  return (
    <button type="button" onClick={() => open("courier")}
      className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-[rgb(var(--surface))]">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-[rgb(var(--muted))]" />
        <span className="text-sm text-[rgb(var(--muted))]">
          {courierInstructions?.trim() ? courierInstructions : t("checkout.courierInstructions")}
        </span>
      </div>
      <ChevronRight className="h-5 w-5 text-[rgb(var(--muted))] shrink-0" />
    </button>
  );
};

export default CourierInstructionsRow;
