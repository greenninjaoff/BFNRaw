"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { CreditCard, Wallet } from "lucide-react";

const PaymentSection = () => {
  const t = useT();
  const savedCards = useCheckoutStore((s) => s.savedCards);
  const selectedCardId = useCheckoutStore((s) => s.selectedCardId);
  const isAddingNewCard = useCheckoutStore((s) => s.isAddingNewCard);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const selectSavedCard = useCheckoutStore((s) => s.selectSavedCard);
  const selectAddNewCard = useCheckoutStore((s) => s.selectAddNewCard);
  const selectPayme = useCheckoutStore((s) => s.selectPayme);
  const selectClick = useCheckoutStore((s) => s.selectClick);
  const open = useCheckoutStore((s) => s.open);

  const cardPill = (isActive: boolean) =>
    `flex-none flex flex-col justify-between w-36 h-20 rounded-2xl border-2 p-3 text-left transition cursor-pointer ${
      isActive
        ? "border-[rgb(var(--text))] bg-[rgb(var(--card))]"
        : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--muted))]"
    }`;

  return (
    <div className="px-4 py-5">
      <h2 className="mb-4 text-xl font-bold text-[rgb(var(--text))]">{t("checkout.payment")}</h2>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* Saved cards */}
        {savedCards.map((card) => {
          const active = paymentMethod === "card" && selectedCardId === card.id && !isAddingNewCard;
          return (
            <button key={card.id} type="button" onClick={() => selectSavedCard(card.id)} className={cardPill(active)}>
              <CreditCard className="h-4 w-4 text-[rgb(var(--muted))]" />
              <div>
                <p className="text-xs font-semibold text-[rgb(var(--text))] truncate">{card.maskedNumber}</p>
                {card.brand && <p className="text-[10px] text-[rgb(var(--muted))] mt-0.5">{card.brand}</p>}
              </div>
            </button>
          );
        })}

        {/* Add new card */}
        <button type="button" onClick={() => { selectAddNewCard(); open("card"); }}
          className={cardPill(paymentMethod === "card" && isAddingNewCard)}>
          <CreditCard className="h-4 w-4 text-[rgb(var(--muted))]" />
          <p className="text-xs font-semibold text-[rgb(var(--text))]">{t("checkout.linkCard")}</p>
        </button>

        {/* Payme */}
        <button type="button" onClick={selectPayme} className={cardPill(paymentMethod === "payme")}>
          <Wallet className="h-4 w-4 text-blue-500" />
          <p className="text-xs font-semibold text-[rgb(var(--text))]">Payme</p>
        </button>

        {/* Click */}
        <button type="button" onClick={selectClick} className={cardPill(paymentMethod === "click")}>
          <Wallet className="h-4 w-4 text-green-500" />
          <p className="text-xs font-semibold text-[rgb(var(--text))]">Click</p>
        </button>
      </div>
    </div>
  );
};

export default PaymentSection;
