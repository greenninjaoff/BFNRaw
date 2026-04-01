"use client";

import { useEffect, useState } from "react";
import useAdminLangStore from "@/stores/adminLangStore";
import { resolveImage } from "@/lib/imageUtils";
import { fmtDateTime } from "@/lib/tz";

import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Package, MapPin, ExternalLink, User, Phone, CreditCard, Truck, Clock } from "lucide-react";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID:      "bg-blue-100 text-blue-800 border-blue-200",
  SHIPPED:   "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED:  "bg-muted text-muted-foreground border-border",
};

const fmt = (n: number | string) => Number(n).toLocaleString("ru-RU");

function googleMapsUrl(order: any): string | null {
  // Use saved address lat/lng if order was placed with a saved address
  // Fall back to text-based search
  const parts = [order.street, order.house, order.district, order.city].filter(Boolean);
  if (!parts.length) return null;
  const query = encodeURIComponent(parts.join(", "));
  return `https://maps.google.com/?q=${query}`;
}

function OrderRow({ order, onStatusChange }: { order: any; onStatusChange: () => void }) {
  const { t, lang } = useAdminLangStore();
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleStatus = async (newStatus: string) => {
    setUpdating(true);
    try { await adminApi.updateOrderStatus(order.id, newStatus); onStatusChange(); }
    catch (e: any) { setError(e.message); setTimeout(() => setError(''), 4000); }
    finally { setUpdating(false); }
  };

  const items = (order.items || []).filter(Boolean);
  const addressParts = [order.city, order.district, order.street, order.house, order.apartment].filter(Boolean);
  const addressLine = addressParts.join(", ") || null;
  const mapsUrl = googleMapsUrl(order);

  const date = fmtDateTime(order.createdAt, lang);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {error && <div className="px-4 pt-3 text-xs text-red-500">{error}</div>}
      {/* ── Summary row ── */}
      <div className="flex items-start gap-3 p-4 flex-wrap">
        <div className="flex-1 min-w-0 space-y-1">
          {/* ID + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-muted-foreground">
              #{order.id.slice(-8).toUpperCase()}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${STATUS_STYLES[order.status] || "bg-muted text-muted-foreground border-border"}`}>
              {order.status}
            </span>
          </div>

          {/* Customer */}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="flex items-center gap-1 text-muted-foreground">
              <User className="w-3 h-3" />
              {order.userFullName || order.customerName || "-"}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Phone className="w-3 h-3" />
              {order.userPhone || order.customerPhone || "-"}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="w-3 h-3" />
              {date}
            </span>
          </div>

          {/* Items preview */}
          <div className="flex items-center gap-2 mt-1">
            {items.slice(0, 4).map((item: any, i: number) =>
              item.imageSnapshot ? (
                <img key={i} src={resolveImage(item.imageSnapshot)} alt={item.nameSnapshot || ""}
                  className="w-8 h-8 rounded-lg object-contain bg-muted border border-border shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div key={i} className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )
            )}
            {items.length > 4 && (
              <span className="text-xs text-muted-foreground">+{items.length - 4} more</span>
            )}
            {items.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
          </div>
        </div>

        {/* Right: total + status selector + expand */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-base font-bold">{fmt(order.totalAmount)} sum</span>
          <select value={order.status} onChange={(e) => handleStatus(e.target.value)} disabled={updating}
            className="rounded-xl border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-50 cursor-pointer">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {open && (
        <div className="border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

            {/* Left: order info */}
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("orders.orderDetails")}</h3>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  { icon: <CreditCard className="w-3.5 h-3.5" />, label: t("orders.payment"), value: order.paymentMethod },
                  { icon: <Truck className="w-3.5 h-3.5" />,      label: t("orders.delivery"), value: order.deliveryType },
                  { icon: <Phone className="w-3.5 h-3.5" />,      label: t("orders.contact"),  value: order.customerPhone || order.userPhone || "-" },
                  { icon: null,                                    label: t("orders.subtotal"),  value: `${fmt(order.subtotalAmount)} sum` },
                  { icon: null,                                    label: t("orders.deliveryFee"), value: `${fmt(order.deliveryFee)} sum` },
                  ...(Number(order.serviceFee) > 0 ? [{ icon: null, label: t("orders.serviceFee"), value: `${fmt(order.serviceFee)} sum` }] : []),
                  ...(Number(order.discountAmount) > 0 ? [{ icon: null, label: t("orders.discount"), value: `-${fmt(order.discountAmount)} sum` }] : []),
                  { icon: null, label: t("orders.total"), value: `${fmt(order.totalAmount)} sum` },
                  ...(order.notes ? [{ icon: null, label: t("orders.notes"), value: order.notes }] : []),
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-1.5">
                    {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
                    <div className={icon ? "" : ""}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium text-sm">{value || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {t("orders.deliveryAddress")}
                </p>
                {addressLine ? (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{addressLine}</p>
                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline shrink-0 mt-0.5 transition">
                        <ExternalLink className="w-3 h-3" />{t("orders.maps")}
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
                {order.deliveryInstructions && (
                  <p className="text-xs text-muted-foreground italic mt-1">{order.deliveryInstructions}</p>
                )}
              </div>
            </div>

            {/* Right: items */}
            <div className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("orders.items")} ({items.length})
              </h3>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      {/* Image */}
                      <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageSnapshot ? (
                          <img src={resolveImage(item.imageSnapshot)} alt={item.nameSnapshot || ""}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.nameSnapshot || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {[item.flavorSnapshot, item.netWeightSnapshot].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(item.unitPrice)} sum x {item.quantity}
                        </p>
                      </div>
                      {/* Line total */}
                      <p className="text-sm font-semibold shrink-0">
                        {fmt(Number(item.unitPrice) * item.quantity)} sum
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { t } = useAdminLangStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getOrders({ status: filterStatus || undefined, limit: 100 })
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterStatus]);

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{t("nav.orders")}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterStatus("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!filterStatus ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t("filter.all")}
          </button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onStatusChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}
