"use client";
import { fmtDate } from "@/lib/tz";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function resolveImg(url?: string | null) {
  if (!url) return "/placeholder.png";
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "@/stores/authStore";
import { ordersApi } from "@/lib/api";
import { Package, Clock, CheckCircle, XCircle, Truck, RefreshCw, ChevronDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useT } from "@/i18n/t";
import useLangStore from "@/stores/langStore";

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  PAID:      "bg-blue-100 text-blue-700",
  SHIPPED:   "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-[rgb(var(--surface))] text-[rgb(var(--muted))]",
  REFUNDED:  "bg-[rgb(var(--surface))] text-[rgb(var(--muted))]",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock className="w-3 h-3" />,
  PAID:      <CheckCircle className="w-3 h-3" />,
  SHIPPED:   <Truck className="w-3 h-3" />,
  DELIVERED: <CheckCircle className="w-3 h-3" />,
  CANCELLED: <XCircle className="w-3 h-3" />,
  REFUNDED:  <RefreshCw className="w-3 h-3" />,
};
const ACTIVE_STATUSES = ["PENDING", "PAID", "SHIPPED"];

function OrderCard({ order, onCancel, t }: { order: any; onCancel?: (id: string) => void; t: (k: string) => string }) {
  const { lang } = useLangStore();
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm(t("orders.cancel") + "?")) return;
    setCancelling(true);
    try { await ordersApi.cancelOrder(order.id); onCancel?.(order.id); }
    catch (e: any) { setCancelError(e.message); }
    finally { setCancelling(false); }
  };

  const items = (order.items || []).filter(Boolean);
  const total = `${Number(order.totalAmount).toLocaleString("ru-RU")} sum`;
  const date = fmtDate(order.createdAt, lang);
  const statusLabel = t(`status.${order.status}`);

  return (
    <div className="rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-[rgb(var(--muted))]">#{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{date}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[order.status] || "bg-[rgb(var(--surface))] text-[rgb(var(--muted))]"}`}>
            {STATUS_ICON[order.status]}{statusLabel}
          </span>
        </div>

        {/* Item image thumbnails */}
        {items.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {items.slice(0, 4).map((item: any, i: number) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] flex items-center justify-center overflow-hidden shrink-0">
                {item.imageSnapshot ? (
                  <img src={resolveImg(item.imageSnapshot)} alt={item.nameSnapshot || ""}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <Package className="w-4 h-4 text-[rgb(var(--muted))]" />
                )}
              </div>
            ))}
            {items.length > 4 && (
              <span className="text-xs text-[rgb(var(--muted))]">+{items.length - 4}</span>
            )}
          </div>
        )}

        {/* Expand toggle */}
        <button type="button" onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm text-[rgb(var(--text))] hover:opacity-70 transition">
          <span className="font-medium">
            {items.length} {items.length !== 1 ? t("orders.items") : t("orders.item")}
          </span>
          <ChevronDown className={`w-4 h-4 text-[rgb(var(--muted))] transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded items */}
        {expanded && items.length > 0 && (
          <div className="mt-3 space-y-3 pt-3 border-t border-[rgb(var(--border))]">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imageSnapshot ? (
                    <img src={resolveImg(item.imageSnapshot)} alt={item.nameSnapshot || ""}
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <Package className="w-4 h-4 text-[rgb(var(--muted))]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgb(var(--text))] truncate">{item.nameSnapshot}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {[item.flavorSnapshot, item.netWeightSnapshot].filter(Boolean).join(" - ")}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">x{item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-[rgb(var(--text))] shrink-0">
                  {(Number(item.unitPrice) * item.quantity).toLocaleString("ru-RU")} sum
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgb(var(--border))]">
          <span className="text-sm font-bold text-[rgb(var(--text))]">{total}</span>
          {order.status === "PENDING" && onCancel && (
            <>
              {cancelError && <p className="text-xs text-red-500 mb-1">{cancelError}</p>}
              <button onClick={handleCancel} disabled={cancelling}
                className="text-xs text-red-500 hover:underline disabled:opacity-50">
                {cancelling ? t("orders.cancelling") : t("orders.cancel")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type Tab = "active" | "history";

export default function OrdersPage() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("active");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    ordersApi.getMyOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const handleCancel = (id: string) =>
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "CANCELLED" } : o));

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const history = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const displayed = activeTab === "active" ? active : history;

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative"><PageHeader title={t("orders.title")} backFallback="/" /></div>

      <div className="flex bg-[rgb(var(--surface))] rounded-2xl p-1 mb-5">
        {(["active", "history"] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? "bg-[rgb(var(--bg))] text-[rgb(var(--text))] shadow-sm" : "text-[rgb(var(--muted))]"}`}>
            {tab === "active"
              ? `${t("orders.active")}${active.length > 0 ? ` (${active.length})` : ""}`
              : t("orders.history")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-6 w-6 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--btn-bg))] animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-[rgb(var(--muted))] mx-auto mb-4 opacity-30" />
          <p className="text-[rgb(var(--muted))]">{activeTab === "active" ? t("orders.noActive") : t("orders.noHistory")}</p>
          {activeTab === "active" && (
            <Link href="/products" className="mt-4 inline-block bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[rgb(var(--btn-bg-hover))] transition">
              {t("common.viewAll")}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((o) => <OrderCard key={o.id} order={o} t={t} onCancel={activeTab === "active" ? handleCancel : undefined} />)}
        </div>
      )}
    </div>
  );
}
