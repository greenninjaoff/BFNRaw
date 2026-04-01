"use client";
import { trackEvent } from "@/lib/analytics";

import OrderStep2 from "@/components/checkout/OrderStep2";
import OrderStep3 from "@/components/checkout/OrderStep3";
import CartStep1 from "@/components/checkout/OrderStep1";
import useCartStore from "@/stores/cartStore";
import useCheckoutStore from "@/stores/checkoutStore";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useT } from "@/i18n/t";
import { formatPrice } from "@/lib/formatPrice";
import { useCheckoutInit } from "@/hooks/useCheckoutInit";
import { useSettings } from "@/hooks/useSettings";

const CartClient = () => {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStep = parseInt(searchParams.get("step") || "1", 10);
  const orderId = searchParams.get("orderId") || undefined;

  useCheckoutInit();
  const { deliveryFee: settingsDeliveryFee } = useSettings();

  const { cart, removeFromCart, updateQuantity } = useCartStore();
  const setPriceDetails = useCheckoutStore((s) => s.setPriceDetails);
  const promoDiscount = useCheckoutStore((s) => s.promoDiscount);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    const itemsTotal = subtotal;
    const deliveryFee = subtotal > 0 ? settingsDeliveryFee : 0;
    const discount = promoDiscount || 0;
    const total = Math.max(0, itemsTotal + deliveryFee - discount);
    // No service fee, no priority fee
    setPriceDetails({ itemsTotal, deliveryFee, serviceFee: 0, priorityFee: 0, total });
  }, [subtotal, settingsDeliveryFee, promoDiscount, setPriceDetails]);

  const goToStep = (step: number) => router.push(`/cart?step=${step}`, { scroll: false });
  const incQty = (productId: number | string, sku: string, qty: number) =>
    updateQuantity({ productId, sku }, qty + 1);
  const decQty = (productId: number | string, sku: string, qty: number) => {
    if (qty <= 1) { removeFromCart({ productId, sku }); return; }
    updateQuantity({ productId, sku }, qty - 1);
  };

  if (activeStep === 3) return <OrderStep3 orderId={orderId} />;

  const CartHeader = () => (
    <div className="relative flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))] sticky top-0 bg-[rgb(var(--bg))] z-10">
      {activeStep > 1 ? (
        <button onClick={() => goToStep(activeStep - 1)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
      ) : <div className="w-9" />}
      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-lg font-semibold text-[rgb(var(--text))]">
          {activeStep === 1 ? t("cart.title") : t("checkout.title")}
        </h1>
      </span>
      <div className="w-9" />
    </div>
  );

  return (
    <div className="mt-0 -mx-4 lg:mx-0">
      <CartHeader />
      {activeStep === 1 && (
        <div className="px-4 pt-4 pb-32">
          <CartStep1 t={t} cart={cart as any} onInc={incQty} onDec={decQty} />
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-[rgb(var(--bg))] border-t border-[rgb(var(--border))] px-4 py-3 z-40">
              <div className="flex items-center justify-between max-w-lg mx-auto">
                <div>
                  <p className="text-xs text-[rgb(var(--muted))]">{t("cart.subtotal")}</p>
                  <p className="text-lg font-semibold text-[rgb(var(--text))]">{formatPrice(subtotal)}</p>
                </div>
                <button onClick={() => { trackEvent("CHECKOUT_START"); goToStep(2); }}
                  className="bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition hover:bg-[rgb(var(--btn-bg-hover))]">
                  {t("cart.continue")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {activeStep === 2 && <OrderStep2 />}
    </div>
  );
};

export default CartClient;
