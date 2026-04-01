"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";

const CourierInstructionsSheet = () => {
  const t = useT();
  const openSheet = useCheckoutStore((s) => s.openSheet);
  const close = useCheckoutStore((s) => s.close);
  const courierInstructions = useCheckoutStore((s) => s.courierInstructions);
  const setCourierInstructions = useCheckoutStore((s) => s.setCourierInstructions);
  const isOpen = openSheet === "courier";
  const [value, setValue] = useState("");

  useEffect(() => { if (isOpen) setValue(courierInstructions); }, [isOpen, courierInstructions]);

  const handleSave = () => { setCourierInstructions(value.trim()); close(); };

  return (
    <BottomSheet open={isOpen} onClose={() => close()} title={t("checkout.courierInstructions")}>
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted))]">{t("checkout.addInstructions")}</p>
        <textarea value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={t("checkout.instructionsPlaceholder")}
          className="min-h-[140px] w-full resize-none rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--btn-bg))]" />
        <div className="flex gap-3">
          <button type="button" onClick={() => setValue("")}
            className="flex-1 rounded-2xl border border-[rgb(var(--border))] px-4 py-3 text-sm font-medium text-[rgb(var(--text))]">
            Clear
          </button>
          <button type="button" onClick={handleSave}
            className="flex-1 rounded-2xl bg-[rgb(var(--btn-bg))] px-4 py-3 text-sm font-semibold text-[rgb(var(--btn-text))] transition hover:bg-[rgb(var(--btn-bg-hover))]">
            Save
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default CourierInstructionsSheet;
