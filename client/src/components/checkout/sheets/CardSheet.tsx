"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import useCheckoutStore from "@/stores/checkoutStore";
import useAuthStore from "@/stores/authStore";
import { cardsApi } from "@/lib/api";
import { useT } from "@/i18n/t";

const inputCls =
  "h-[46px] w-full rounded-[18px] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 text-[15px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--btn-bg))]";

const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

const CardSheet = () => {
  const t = useT();
  const openSheet = useCheckoutStore((s) => s.openSheet);
  const close = useCheckoutStore((s) => s.close);
  const addSavedCard = useCheckoutStore((s) => s.addSavedCard);
  const selectSavedCard = useCheckoutStore((s) => s.selectSavedCard);
  const { user } = useAuthStore();
  const isOpen = openSheet === "card";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) { setCardNumber(""); setExpiry(""); setCvc(""); setError(""); }
  }, [isOpen]);

  const handleSave = async () => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 12) { setError(t("common.cardNumberLength")); return; }

    const last4 = digits.slice(-4);
    const first4 = digits.slice(0, 4);
    const masked = `${first4} •••• •••• ${last4}`;
    const brand = digits[0] === "4" ? "Visa"
      : digits[0] === "5" ? "Mastercard"
      : digits.slice(0, 4) === "8600" ? "UzCard"
      : digits.slice(0, 4) === "9860" ? "Humo"
      : "Card";

    setSaving(true); setError("");
    try {
      let cardData: { id: string; maskedNumber: string; brand: string };
      if (user) {
        const saved = await cardsApi.add({ maskedNumber: masked, brand });
        cardData = { id: saved.id, maskedNumber: saved.maskedNumber, brand: saved.brand || brand };
      } else {
        cardData = { id: Date.now().toString(), maskedNumber: masked, brand };
      }
      addSavedCard(cardData); selectSavedCard(cardData.id); close();
    } catch (e: any) { setError(e.message || t("errors.failedToSaveCard")); }
    finally { setSaving(false); }
  };

  return (
    <BottomSheet open={isOpen} onClose={close} title={t("checkout.linkCard")}>
      <div className="space-y-3">
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[rgb(var(--muted))]">{t("common.cardNumber")}</label>
          <input type="text" inputMode="numeric" value={formatCardNumber(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="0000 0000 0000 0000" className={`${inputCls} font-mono tracking-widest`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[rgb(var(--muted))]">{t("common.expirationDate")}</label>
            <input type="text" inputMode="numeric" value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY" maxLength={5} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[rgb(var(--muted))]">{t("common.cvv")}</label>
            <input type="text" inputMode="numeric" value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="•••" maxLength={4} className={inputCls} />
          </div>
        </div>
        <button type="button" onClick={handleSave} disabled={saving}
          className="h-12 w-full rounded-2xl bg-[rgb(var(--btn-bg))] text-sm font-semibold text-[rgb(var(--btn-text))] transition hover:bg-[rgb(var(--btn-bg-hover))] disabled:opacity-60 flex items-center justify-center">
          {saving ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : t("checkout.linkCard")}
        </button>
      </div>
    </BottomSheet>
  );
};

export default CardSheet;
