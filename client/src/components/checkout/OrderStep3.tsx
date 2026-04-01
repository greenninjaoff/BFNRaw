"use client";

import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ordersApi } from "@/lib/api";
import useAuthStore from "@/stores/authStore";
import { useT } from "@/i18n/t";
import { formatPrice } from "@/lib/formatPrice";

export default function OrderStep3({ orderId }: { orderId?: string }) {
  const t = useT();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId && user) {
      ordersApi.getOne(orderId)
        .then((o) => { if (o) setOrder(o); })
        .catch(() => {});
    }
  }, [orderId, user]);

  const displayId = orderId ? orderId.slice(-8).toUpperCase() : null;
  const total = order ? Number(order.totalAmount) : null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[60vh]">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-lime-100 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-lime-600" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">{t("checkout.orderConfirmed")}</h1>
      <p className="text-sm text-[rgb(var(--muted))] mb-1">
        {displayId ? `#${displayId}` : ""}
      </p>
      {total !== null && (
        <p className="text-lg font-bold text-[rgb(var(--text))] mt-2">{formatPrice(total)}</p>
      )}

      {order?.items && order.items.filter(Boolean).length > 0 && (
        <div className="mt-6 w-full max-w-xs rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-4 space-y-2 text-left">
          {order.items.filter(Boolean).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-[rgb(var(--text))] truncate flex-1">
                {item.nameSnapshot}{item.flavorSnapshot ? ` - ${item.flavorSnapshot}` : ""}
              </span>
              <span className="text-[rgb(var(--muted))] ml-2 shrink-0">×{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Link href="/orders"
          className="w-full h-12 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] font-semibold text-sm flex items-center justify-center gap-2 transition hover:bg-[rgb(var(--btn-bg-hover))]">
          <Package className="w-4 h-4" />{t("checkout.trackOrder")}
        </Link>
        <Link href="/"
          className="w-full h-12 rounded-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text))] font-semibold text-sm flex items-center justify-center gap-2 transition hover:bg-[rgb(var(--border))]">
          {t("common.continue")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
