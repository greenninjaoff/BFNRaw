"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { promoApi } from "@/lib/api";
import { CheckCircle, XCircle } from "lucide-react";

const PromoSheet = () => {
  const t = useT();
  const openSheet = useCheckoutStore((s) => s.openSheet);
  const close = useCheckoutStore((s) => s.close);
  const promoCode = useCheckoutStore((s) => s.promoCode);
  const setPromoCode = useCheckoutStore((s) => s.setPromoCode);
  const setPromoDiscount = useCheckoutStore((s) => s.setPromoDiscount);
  const itemsTotal = useCheckoutStore((s) => s.itemsTotal);
  const isOpen = openSheet === "promo";

  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [message, setMessage] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setValue(promoCode || "");
      setState("idle"); setMessage(""); setDiscount(0);
    }
  }, [isOpen, promoCode]);

  const handleCheck = async () => {
    if (!value.trim()) return;
    setState("checking"); setMessage(t("checkout.promoValidating")); setDiscount(0);
    try {
      const result = await promoApi.validate(value.trim(), itemsTotal);
      if (result.valid) {
        setState("valid");
        setDiscount(result.discountAmount || 0);
        setMessage(`${result.discountType === "percent" ? `${result.discountValue}%` : `${(result.discountValue || 0).toLocaleString("ru-RU")} sum`} ${t("checkout.discount").toLowerCase()} - -${(result.discountAmount || 0).toLocaleString("ru-RU")} sum`);
      } else {
        setState("invalid");
        setMessage(result.error || t("checkout.promoInvalid"));
        setDiscount(0);
      }
    } catch {
      setState("invalid");
      setMessage(t("checkout.promoInvalid"));
    }
  };

  const handleApply = () => {
    setPromoCode(value.trim().toUpperCase());
    setPromoDiscount(discount);
    close();
  };

  const handleClear = () => {
    setValue(""); setState("idle"); setMessage(""); setDiscount(0);
    setPromoCode(""); setPromoDiscount(0);
  };

  return (
    <BottomSheet open={isOpen} onClose={close} title={t("checkout.promoCode")}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value.toUpperCase()); setState("idle"); setMessage(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder="PROMO2026"
            className="flex-1 h-12 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-sm uppercase text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--btn-bg))] tracking-widest"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!value.trim() || state === "checking"}
            className="h-12 px-4 rounded-2xl bg-[rgb(var(--surface))] text-sm font-medium text-[rgb(var(--text))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--border))] disabled:opacity-50 transition whitespace-nowrap"
          >
            {state === "checking" ? (
              <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin inline-block" />
            ) : t("common.check")}
          </button>
        </div>

        {/* Status message */}
        {message && (
          <div className={`flex items-center gap-2 text-sm rounded-2xl px-3 py-2.5 ${
            state === "valid"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {state === "valid"
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-2xl border border-[rgb(var(--border))] px-4 py-3 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--surface))]"
          >
            {t("common.clear")}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={state !== "valid"}
            className="flex-1 rounded-2xl bg-[rgb(var(--btn-bg))] px-4 py-3 text-sm font-semibold text-[rgb(var(--btn-text))] transition hover:bg-[rgb(var(--btn-bg-hover))] disabled:opacity-40"
          >
            {t("common.apply")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default PromoSheet;
