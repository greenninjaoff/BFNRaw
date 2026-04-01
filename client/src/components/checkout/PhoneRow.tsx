"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { ChevronRight, Phone } from "lucide-react";

const PhoneRow = () => {
  const t = useT();
  const phone = useCheckoutStore((s) => s.phone);
  const open = useCheckoutStore((s) => s.open);

  return (
    <button type="button" onClick={() => open("phone")}
      className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-[rgb(var(--surface))]">
      <div className="flex items-center gap-3">
        <Phone className="h-5 w-5 text-[rgb(var(--muted))]" />
        <div>
          <p className="text-xs text-[rgb(var(--muted))] leading-none mb-0.5">{t("checkout.recipientPhone")}</p>
          <p className="text-sm font-medium text-[rgb(var(--text))]">
            {phone?.trim() ? phone : <span className="text-[rgb(var(--muted))] font-normal">{t("checkout.addPhone")}</span>}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[rgb(var(--muted))] shrink-0" />
    </button>
  );
};

export default PhoneRow;
