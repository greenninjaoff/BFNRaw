"use client";
import { useT } from "@/i18n/t";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import useCheckoutStore from "@/stores/checkoutStore";

const PhoneSheet = () => {
  const t = useT();
  const openSheet = useCheckoutStore((s) => s.openSheet);
  const close = useCheckoutStore((s) => s.close);
  const phone = useCheckoutStore((s) => s.phone);
  const setPhone = useCheckoutStore((s) => s.setPhone);
  const isOpen = openSheet === "phone";
  const [value, setValue] = useState("");

  useEffect(() => { if (isOpen) setValue(phone || ""); }, [isOpen, phone]);

  const handleSave = () => { setPhone(value.trim()); close(); };

  return (
    <BottomSheet open={isOpen} onClose={close} title={t("checkout.recipientPhone")}>
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted))]">{t("checkout.phoneHint")}</p>
        <input type="tel" value={value} onChange={(e) => setValue(e.target.value)} placeholder="+998 90 123 45 67"
          className="h-12 w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--btn-bg))]" />
        <button type="button" onClick={handleSave}
          className="w-full rounded-2xl bg-[rgb(var(--btn-bg))] px-4 py-3 text-sm font-semibold text-[rgb(var(--btn-text))] transition hover:bg-[rgb(var(--btn-bg-hover))] active:bg-[rgb(var(--btn-bg-hover))]">
          {t("common.save")}
        </button>
      </div>
    </BottomSheet>
  );
};

export default PhoneSheet;
