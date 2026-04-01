"use client";
import { trackEvent } from "@/lib/analytics";

import useCheckoutStore from "@/stores/checkoutStore";
import useCartStore from "@/stores/cartStore";
import useAuthStore from "@/stores/authStore";
import { ordersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/t";

const fmt = (v: number) => `${v.toLocaleString("ru-RU")} sum`;

const StickyOrderBar = () => {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = useCheckoutStore((s) => s.total);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const phone = useCheckoutStore((s) => s.phone);
  const courierInstructions = useCheckoutStore((s) => s.courierInstructions);
  const entrance = useCheckoutStore((s) => s.entrance);
  const floor = useCheckoutStore((s) => s.floor);
  const apartment = useCheckoutStore((s) => s.apartment);
  const doorCode = useCheckoutStore((s) => s.doorCode);
  const promoCode = useCheckoutStore((s) => s.promoCode);
  const promoDiscount = useCheckoutStore((s) => s.promoDiscount);
  const leaveAtDoor = useCheckoutStore((s) => s.leaveAtDoor);
  const resetCheckout = useCheckoutStore((s) => s.resetCheckout);

  const { cart, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    setError("");
    if (!user) { router.push("/login"); return; }
    if (!cart.length) { setError(t("errors.cartEmpty")); return; }
    if (!phone && !selectedAddressId) { setError(t("errors.noDeliveryAddress")); return; }

    const items = cart.map((item) => ({ flavorId: item.flavorId || item.sku, quantity: item.quantity }));
    const notes = [
      courierInstructions,
      leaveAtDoor ? t("checkout.leaveAtDoor") : "",
      entrance ? `${t("checkout.entrance")} ${entrance}` : "",
      floor ? `${t("checkout.floor")} ${floor}` : "",
      apartment ? `${t("checkout.aptOffice")} ${apartment}` : "",
      doorCode ? `${t("checkout.doorPhone")}: ${doorCode}` : "",
    ].filter(Boolean).join(", ");

    setLoading(true);
    try {
      const order = await ordersApi.createOrder({
        items,
        deliveryType: "STANDARD",
        paymentMethod: paymentMethod.toUpperCase(),
        addressId: selectedAddressId || undefined,
        customerPhone: phone || undefined,
        deliveryInstructions: notes || undefined,
        promoCode: promoCode || undefined,
        discountAmount: promoDiscount > 0 ? promoDiscount : undefined,
        notes: promoCode ? `Promo: ${promoCode}` : undefined,
      });
      trackEvent("ORDER_PLACED", { orderId: order.id });
      trackEvent("PAYMENT_SUCCESS", { orderId: order.id });
      clearCart();
      resetCheckout();
      router.push(`/cart?step=3&orderId=${order.id}`);
    } catch (e: any) {
      setError(e.message || t("errors.orderFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[rgb(var(--bg))] border-t border-[rgb(var(--border))] px-4 pb-4 pt-3">
      <div className="mx-auto max-w-[640px]">
        {error && <p className="mb-2 text-xs text-red-500 text-center">{error}</p>}
        <div className="flex items-center gap-3">
          <div className="min-w-[100px]">
            <p className="text-base font-bold text-[rgb(var(--text))]">{fmt(total)}</p>
            <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{t("checkout.total")}</p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[rgb(var(--btn-bg))] px-6 py-4 text-base font-bold text-[rgb(var(--btn-text))] transition hover:bg-[rgb(var(--btn-bg-hover))] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center"
          >
            {loading
              ? <span className="h-5 w-5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
              : t("checkout.payNow")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyOrderBar;
