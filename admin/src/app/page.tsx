"use client";
import useAdminLangStore from "@/stores/adminLangStore";

import { useEffect, useState, useCallback, useRef } from "react";
import { adminApi, ADMIN_STREAM_URL } from "@/lib/api";
import {
  Users, TrendingUp, ShoppingCart, Package,
  Clock, CheckCircle, XCircle, Truck, RefreshCw,
  ArrowRight, ArrowUp, ArrowDown, Minus,
  ShoppingBag, UserPlus, ChevronDown, AlertCircle, Info,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { fmtRelative, fmtPeriodLabel, fmtDateTime } from "@/lib/tz";
import { resolveImage } from "@/lib/imageUtils";

// ─── Color constants ──────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  PAID:      "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  SHIPPED:   "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  DELIVERED: "bg-green-500/15 text-green-400 border border-green-500/20",
  CANCELLED: "bg-red-500/15 text-red-400 border border-red-500/20",
  REFUNDED:  "bg-muted text-muted-foreground border border-border",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock className="w-3 h-3" />,
  PAID:      <CheckCircle className="w-3 h-3" />,
  SHIPPED:   <Truck className="w-3 h-3" />,
  DELIVERED: <CheckCircle className="w-3 h-3" />,
  CANCELLED: <XCircle className="w-3 h-3" />,
  REFUNDED:  <RefreshCw className="w-3 h-3" />,
};
const PIE_COLORS    = ["#a3e635","#22d3ee","#818cf8","#fb923c","#f87171","#94a3b8"];
const CAT_COLORS    = ["#a3e635","#22d3ee","#818cf8","#fb923c","#f87171","#34d399","#f472b6"];
const FUNNEL_COLORS = ["#818cf8","#22d3ee","#fb923c","#a3e635","#34d399"] as const;

type Range   = "day" | "week" | "month" | "year" | "all";
type TabView = "analytics" | "products";
type SortKey = "purchases" | "totalQty" | "revenue" | "revenueShare";

const RANGES: { label: string; value: Range }[] = [
  { label: "Today",    value: "day"   },
  { label: "7 days",  value: "week"  },
  { label: "30 days", value: "month" },
  { label: "Year",    value: "year"  },
  { label: "All time",value: "all"   },
];

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtMoney = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} sum`;
const fmtNum   = (n: number) => Math.round(n).toLocaleString("ru-RU");
const makeFmtP = (hint: string) =>
  (p: string) => fmtPeriodLabel(p, hint as "hour" | "day" | "month");

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Spinner = ({ h = 120 }: { h?: number }) => (
  <div className="flex items-center justify-center" style={{ height: h }}>
    <span className="h-5 w-5 rounded-full border-2 border-muted border-t-primary animate-spin" />
  </div>
);

function NoData({
  msg    = "No data available for this period",
  detail,
  h      = false,
}: { msg?: string; detail?: string; h?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center ${h ? "py-12" : "py-7"}`}>
      <AlertCircle className="w-5 h-5 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{msg}</p>
      {detail && (
        <p className="text-[11px] text-muted-foreground/50 max-w-xs leading-relaxed">{detail}</p>
      )}
    </div>
  );
}

function MissingBanner({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-amber-400">Missing data</p>
          {items.map((item, i) => {
            const [code, ...rest] = item.split(": ");
            return (
              <p key={i} className="text-[11px] text-muted-foreground">
                <span className="font-mono text-amber-400/70">[{code}]</span>
                {rest.length ? ` ${rest.join(": ")}` : ""}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: {
  insight: { type: string; title: string; body: string; positive?: boolean };
}) {
  const pos     = insight.positive;
  const Icon    = pos === undefined ? Minus : pos ? ArrowUp : ArrowDown;
  const border  = pos === undefined ? "border-border" : pos ? "border-green-500/25" : "border-red-500/20";
  const bg      = pos === undefined ? "" : pos ? "bg-green-500/5" : "bg-red-500/5";
  const iconCls = pos === undefined
    ? "bg-muted text-muted-foreground"
    : pos ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400";
  return (
    <div className={`rounded-xl p-3.5 border ${border} ${bg}`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 flex h-5 w-5 rounded-full items-center justify-center shrink-0 ${iconCls}`}>
          <Icon className="w-3 h-3" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">{insight.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{insight.body}</p>
        </div>
      </div>
    </div>
  );
}

function SortTh({ label, col, active, onClick }: {
  label: string; col: SortKey; active: boolean; onClick: (c: SortKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(col)}
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <ChevronDown className={`w-3 h-3 ${active ? "opacity-100" : "opacity-30"}`} />
    </button>
  );
}

// ─── Products Analytics tab ────────────────────────────────────────────────────
function ProductsAnalytics({ range }: { range: Range }) {
  const { t } = useAdminLangStore();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr,setFetchErr]= useState("");
  const [sortKey, setSortKey] = useState<SortKey>("purchases");

  useEffect(() => {
    setLoading(true); setFetchErr("");
    adminApi.getProductsAnalytics(range)
      .then(setData)
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <Spinner h={280} />;
  if (fetchErr) return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex gap-2">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      Failed to load products analytics: {fetchErr}
    </div>
  );
  if (!data) return <NoData h />;

  const {
    summary, products: rawProducts, timeChart, categoryChart,
    insights, funnel, labelHint, missing = [],
  } = data;

  // Purely local sort - never triggers re-fetch, no duplicates
  const products  = [...(rawProducts as any[])].sort((a, b) => b[sortKey] - a[sortKey]);
  const hasProds  = products.length > 0;
  const fmtP      = makeFmtP(labelHint);
  const allZero   = summary.totalRevenue === 0 && summary.totalOrders === 0;
  const groupHint = labelHint === "hour" ? "by hour" : labelHint === "month" ? "by month" : "by day";

  return (
    <div className="space-y-6">
      <MissingBanner items={missing} />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Revenue",       value: fmtMoney(summary.totalRevenue), icon: <TrendingUp className="w-4 h-4 text-lime-400" />,    zero: summary.totalRevenue === 0 },
          { label: "Orders",        value: fmtNum(summary.totalOrders),    icon: <ShoppingCart className="w-4 h-4 text-purple-400" />, zero: summary.totalOrders === 0  },
          { label: "Items sold",    value: fmtNum(summary.totalItems),     icon: <ShoppingBag className="w-4 h-4 text-blue-400" />,   zero: summary.totalItems === 0   },
          { label: "Avg order",     value: fmtMoney(summary.avgOrderValue),icon: <Package className="w-4 h-4 text-orange-400" />,     zero: summary.avgOrderValue === 0 },
        ].map((m) => (
          <div key={m.label}
            className={`rounded-2xl p-4 border border-border flex items-center gap-3 ${m.zero ? "bg-muted/5 opacity-55" : "bg-muted/10"}`}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {m.icon}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
              <p className="text-base font-bold leading-tight mt-0.5">{m.value}</p>
              {m.zero && <p className="text-[10px] text-muted-foreground/40 mt-0.5">No data</p>}
            </div>
          </div>
        ))}
      </div>

      {allZero && (
        <NoData
          h
          msg="No order data for this period"
          detail="Products analytics aggregate from order items. Place orders through the storefront to populate this section."
        />
      )}

      {/* Profit row - only shown when costPrice > 0 on any variant */}
      {summary.profit !== null ? (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: fmtMoney(summary.totalRevenue), color: "text-foreground"   },
            { label: "Cost",    value: fmtMoney(summary.totalCost),    color: "text-red-400"      },
            { label: t("dashboard.profit"),  value: fmtMoney(summary.profit),
              color: summary.profit >= 0 ? "text-lime-400" : "text-red-400" },
          ].map((r) => (
            <div key={r.label} className="bg-muted/10 rounded-xl p-3 border border-border text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{r.label}</p>
              <p className={`text-sm font-bold mt-0.5 ${r.color}`}>{r.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/50 p-3 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400/50 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Profit unavailable</span> - no{" "}
            <code className="text-[10px] bg-muted px-1 rounded">costPrice</code> set on variants.
            Edit variants in Admin - Products to enable margin tracking.
          </p>
        </div>
      )}

      {/* Insights */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Insights</h3>
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins: any, i: number) => <InsightCard key={i} insight={ins} />)}
          </div>
        ) : (
          <NoData
            msg="No insights yet"
            detail="Insights appear when there are orders in both the current and previous period for comparison."
          />
        )}
      </div>

      {/* Purchases over time */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="font-semibold mb-0.5">Purchases over time</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Grouped {groupHint} - real backend values, no smoothing
        </p>
        {timeChart.length === 0 ? (
          <NoData msg="No purchase data" detail="No OrderItem records in the selected range." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tickFormatter={fmtP}
                tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                width={28} allowDecimals={false} />
              <Tooltip
                formatter={(v: any) => [v, t("dashboard.itemsSold")]} labelFormatter={fmtP}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
              />
              <Bar dataKey="items" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold mb-4">Revenue by category</h3>
          {categoryChart.length === 0 ? (
            <NoData msg="No category data" detail="No orders linked to product categories in this period." />
          ) : (() => {
            const tot = categoryChart.reduce((a: number, x: any) => a + x.revenue, 0);
            return (
              <div className="space-y-3">
                {categoryChart.map((c: any, i: number) => {
                  const pct = tot > 0 ? Math.round((c.revenue / tot) * 100) : 0;
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{c.category}</span>
                        <span className="text-muted-foreground">{pct}% - {fmtNum(c.revenue)} sum</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border flex flex-col">
          <h3 className="font-semibold mb-4">Category split</h3>
          {categoryChart.length === 0 ? (
            <NoData msg="No category data" />
          ) : (
            <div className="flex items-center gap-4 flex-1">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={categoryChart} dataKey="revenue" cx="50%" cy="50%"
                    innerRadius={30} outerRadius={58} paddingAngle={2}>
                    {categoryChart.map((_: any, i: number) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [fmtMoney(Number(v)), "Revenue"]}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1 min-w-0">
                {categoryChart.map((c: any, i: number) => (
                  <div key={c.category} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span className="flex-1 truncate text-muted-foreground">{c.category}</span>
                    <span className="font-semibold shrink-0">{c.purchases} orders</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top products table - sort is purely local, no re-fetch */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Top products</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any column header to sort descending
            </p>
          </div>
          {hasProds && (
            <span className="text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
              {products.length} variant{products.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!hasProds ? (
          <NoData
            h
            msg="No variant sales in this period"
            detail="Variants appear here once orders containing them are placed via the storefront."
          />
        ) : (
          <>
            {/* Sortable header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-muted/15 border-b border-border">
              <div className="col-span-1 text-[10px] text-muted-foreground font-semibold uppercase">#</div>
              <div className="col-span-4 text-[10px] text-muted-foreground font-semibold uppercase">Product / Variant</div>
              <div className="col-span-2 flex justify-end">
                <SortTh label={t("dashboard.orders")}  col="purchases"    active={sortKey === "purchases"}    onClick={setSortKey} />
              </div>
              <div className="col-span-2 flex justify-end">
                <SortTh label={t("dashboard.items")}   col="totalQty"     active={sortKey === "totalQty"}     onClick={setSortKey} />
              </div>
              <div className="col-span-2 flex justify-end">
                <SortTh label={t("dashboard.revenue")} col="revenue"      active={sortKey === "revenue"}      onClick={setSortKey} />
              </div>
              <div className="col-span-1 flex justify-end">
                <SortTh label={t("dashboard.share")}   col="revenueShare" active={sortKey === "revenueShare"} onClick={setSortKey} />
              </div>
            </div>

            {products.map((p: any, idx: number) => {
              const imgSrc = resolveImage(p.imageUrl);
              return (
                <div key={p.flavorId || p.productId}
                  className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-muted/20 transition border-b border-border last:border-0">
                  <div className="col-span-1 text-sm font-bold text-muted-foreground">{idx + 1}</div>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {imgSrc
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={imgSrc} alt={p.productName}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        : <Package className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.productName}</p>
                      {p.flavorName && p.flavorName !== p.productName && (
                        <p className="text-[10px] text-muted-foreground truncate">{p.flavorName}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-bold tabular-nums ${sortKey === "purchases" ? "text-primary" : ""}`}>
                      {fmtNum(p.purchases)}
                    </p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-medium tabular-nums ${sortKey === "totalQty" ? "text-primary" : ""}`}>
                      {fmtNum(p.totalQty)}
                    </p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-semibold tabular-nums ${sortKey === "revenue" ? "text-primary" : ""}`}>
                      {fmtNum(p.revenue)} sum
                    </p>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className={`text-xs font-bold tabular-nums ${sortKey === "revenueShare" ? "text-primary" : "text-muted-foreground"}`}>
                      {p.revenueShare}%
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Conversion funnel */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold">Conversion funnel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {funnel.hasRealData
                ? "Tracked events from client instrumentation"
                : "Client tracking active - no events collected yet for this period"}
            </p>
          </div>
          {funnel.hasRealData && (
            <span className="flex items-center gap-1.5 text-[10px] text-lime-400 font-medium bg-lime-500/10 px-2.5 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              Live data
            </span>
          )}
        </div>

        {!funnel.hasRealData && (
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">No events in AnalyticsEvent table.</span>{" "}
                Tracking fires as users interact with the storefront:
                PRODUCT_VIEW on product page, ADD_TO_CART on add button,
                CHECKOUT_START on step 1 to 2, ORDER_PLACED and PAYMENT_SUCCESS on order submit.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {([
            { key: "PRODUCT_VIEW",    label: "Product viewed",     desc: "Visited a product page",       color: FUNNEL_COLORS[0] },
            { key: "ADD_TO_CART",     label: "Added to cart",      desc: "Clicked add to cart",          color: FUNNEL_COLORS[1] },
            { key: "CHECKOUT_START",  label: "Checkout started",   desc: "Proceeded to checkout step 2", color: FUNNEL_COLORS[2] },
            { key: "ORDER_PLACED",    label: "Order placed",       desc: "Submitted the order",          color: FUNNEL_COLORS[3] },
            { key: "PAYMENT_SUCCESS", label: "Payment confirmed",  desc: "Order confirmed and paid",     color: FUNNEL_COLORS[4] },
          ] as const).map((step, i, arr) => {
            const count    = funnel.hasRealData ? ((funnel[step.key as keyof typeof funnel] as number) || 0) : 0;
            const topCount = funnel.hasRealData ? ((funnel[arr[0].key as keyof typeof funnel] as number) || 1) : 1;
            const pct      = topCount > 0 ? Math.round((count / topCount) * 100) : 0;
            const prev     = i > 0
              ? (funnel.hasRealData ? ((funnel[arr[i-1].key as keyof typeof funnel] as number) || 0) : 0)
              : count;
            const dropPct  = prev > 0 && i > 0 && count < prev
              ? Math.round(((prev - count) / prev) * 100) : 0;

            return (
              <div key={step.key}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: step.color + "22", color: step.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold">{step.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5 hidden sm:inline">{step.desc}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {funnel.hasRealData ? (
                          <span className="text-xs font-bold tabular-nums">{fmtNum(count)}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40 italic">no data</span>
                        )}
                        {dropPct > 0 && (
                          <span className="text-[10px] font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            -{dropPct}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:      funnel.hasRealData ? `${pct}%` : "0%",
                          background: step.color,
                          opacity:    funnel.hasRealData ? 0.85 : 0,
                        }}
                      />
                    </div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="ml-[30px] flex items-center gap-1 mt-1 mb-0.5 h-3">
                    <div className="w-px h-full bg-border ml-2.5" />
                    {dropPct > 0 && (
                      <span className="text-[9px] text-muted-foreground/50 ml-1">{dropPct}% exited here</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useAdminLangStore();
  const [range,       setRange]       = useState<Range>("month");
  const [tab,         setTab]         = useState<TabView>("analytics");
  const [stats,       setStats]       = useState<any>(null);
  const [recent,      setRecent]      = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchErr,    setFetchErr]    = useState("");
  const [sseStatus,   setSseStatus]   = useState<"connecting" | "live" | "off">("connecting");
  const [liveToast,   setLiveToast]   = useState("");
  const sseRef = useRef<EventSource | null>(null);

  const load = useCallback(() => {
    setLoading(true); setFetchErr("");
    Promise.all([adminApi.getStats(range), adminApi.getRecentOrders(), adminApi.getRecentUsers()])
      .then(([s, r, u]) => { setStats(s); setRecent(r); setRecentUsers(u); })
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // SSE live connection
  useEffect(() => {
    const token = (() => {
      try { const r = localStorage.getItem("admin-auth"); return r ? JSON.parse(r)?.state?.token : null; }
      catch { return null; }
    })();
    if (!token) { setSseStatus("off"); return; }
    const es = new EventSource(`${ADMIN_STREAM_URL}?token=${token}`);
    sseRef.current = es;
    es.addEventListener("connected", () => setSseStatus("live"));
    es.addEventListener("new_order", (ev) => {
      const d = JSON.parse((ev as MessageEvent).data);
      setLiveToast(`New order #${d.id.slice(-6).toUpperCase()} - ${Number(d.total).toLocaleString("ru-RU")} sum`);
      setTimeout(() => setLiveToast(""), 5000);
      adminApi.getStats(range).then(setStats).catch(() => {});
      adminApi.getRecentOrders().then(setRecent).catch(() => {});
    });
    es.addEventListener("order_status", (ev) => {
      const d = JSON.parse((ev as MessageEvent).data);
      setLiveToast(`Order #${d.id.slice(-6).toUpperCase()} - ${d.status}`);
      setTimeout(() => setLiveToast(""), 4000);
      adminApi.getStats(range).then(setStats).catch(() => {});
    });
    es.onerror = () => setSseStatus("off");
    return () => { es.close(); sseRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived
  const labelHint  = (stats?.labelHint as string) ?? "day";
  const fmtPeriod  = makeFmtP(labelHint);
  const chartData  = (stats?.revenueChart as any[]) ?? [];
  const pieData    = stats?.orderStatusDist
    ? Object.entries(stats.orderStatusDist as Record<string, number>).map(([k, v]) => ({ name: k, value: v }))
    : [];
  const rt         = stats?.realtime;
  const rtChart    = (rt?.chart as any[]) ?? [];
  const rtFmtP     = makeFmtP("hour");
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "";
  const groupLabel = labelHint === "hour" ? t("dashboard.groupByHour") : labelHint === "month" ? t("dashboard.groupByMonth") : t("dashboard.groupByDay");
  const missing    = (stats?.missing as string[]) ?? [];
  const hasOrders  = (stats?.totalOrders ?? 0) > 0;
  const hasRevenue = (stats?.revenue?.total ?? 0) > 0;
  const hasChart   = chartData.length > 0;
  const hasPie     = pieData.some((p) => p.value > 0);
  const hasRt      = (rt?.orders ?? 0) > 0;
  const hasRtTop   = (rt?.topProducts?.length ?? 0) > 0;

  return (
    <div className="space-y-5 py-4">

      {/* Live toast */}
      {liveToast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-ping" />
          {liveToast}
        </div>
      )}

      {/* Header: tabs + range selector + live indicator */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(["analytics", "products"] as TabView[]).map((tabKey) => (
              <button key={tabKey} onClick={() => setTab(tabKey)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === tabKey ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {tabKey === "analytics" ? t("nav.dashboard") : t("nav.products")}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${
              sseStatus === "live"        ? "bg-lime-400 animate-pulse"
              : sseStatus === "connecting" ? "bg-yellow-400 animate-pulse"
              : "bg-muted-foreground/30"
            }`} />
            {sseStatus === "live" ? t("dashboard.live") : sseStatus === "connecting" ? "..." : t("dashboard.offline")}
          </div>
        </div>
        <div className="flex bg-muted rounded-xl p-1 gap-0.5">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                range === r.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Backend error */}
      {fetchErr && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {fetchErr} - make sure the backend is running.
        </div>
      )}

      {/* ════════════ PRODUCTS TAB ════════════ */}
      {tab === "products" && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="mb-5">
            <h2 className="font-semibold text-lg">Products analytics</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggregated from order items - {rangeLabel} - backend values, no approximations
            </p>
          </div>
          <ProductsAnalytics range={range} />
        </div>
      )}

      {/* ════════════ ANALYTICS TAB ════════════ */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* LEFT: charts + orders (2/3 width) */}
          <div className="xl:col-span-2 space-y-5">

            {!loading && missing.length > 0 && <MissingBanner items={missing} />}

            {/* Orders + Revenue stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: `Orders - ${rangeLabel}`,
                  value: loading ? "..." : fmtNum(stats?.totalOrders ?? 0),
                  sub:   !loading && !hasOrders ? "No orders in this period" : undefined,
                  icon:  <ShoppingCart className="w-5 h-5 text-purple-400" />,
                  dim:   !loading && !hasOrders,
                },
                {
                  label: `Revenue - ${rangeLabel}`,
                  value: loading ? "..." : fmtMoney(stats?.revenue?.total ?? 0),
                  sub:   !loading && !hasRevenue ? "No revenue in this period" : undefined,
                  icon:  <TrendingUp className="w-5 h-5 text-lime-400" />,
                  dim:   !loading && !hasRevenue,
                },
              ].map((card) => (
                <div key={card.label}
                  className={`bg-card rounded-2xl p-5 flex items-center gap-4 border border-border ${card.dim ? "opacity-55" : ""}`}>
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    <p className="text-2xl font-bold leading-tight mt-0.5 truncate">{card.value}</p>
                    {card.sub && <p className="text-[11px] text-muted-foreground/55 mt-0.5">{card.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue breakdown - subtotal / discount / delivery */}
            {!loading && hasRevenue && stats?.revenue && stats.revenue.discount > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Subtotal", value: stats.revenue.subtotal,  color: "text-foreground" },
                  { label: "Discount", value: -stats.revenue.discount, color: "text-red-400"    },
                  { label: "Delivery", value: stats.revenue.delivery,  color: "text-blue-400"   },
                ].map((r) => (
                  <div key={r.label} className="bg-card rounded-xl p-3 border border-border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{r.label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${r.color}`}>
                      {r.value < 0 ? "-" : ""}{fmtNum(Math.abs(r.value))} sum
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Revenue area chart - type="linear" = no artificial smoothing */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h2 className="font-semibold mb-0.5">Revenue - {rangeLabel}</h2>
              <p className="text-xs text-muted-foreground mb-4">{groupLabel}</p>
              {loading ? <Spinner h={200} /> : !hasChart ? (
                <NoData h
                  msg="No revenue data for this period"
                  detail={!hasOrders ? "No orders placed in the selected range." : undefined}
                />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="rev-g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#a3e635" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={fmtPeriod}
                      tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => fmtNum(v)}
                      tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={68} />
                    <Tooltip
                      formatter={(val: any) => [fmtMoney(Number(val)), t("dashboard.revenue")]}
                      labelFormatter={fmtPeriod}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                    />
                    <Area type="linear" dataKey="revenue" stroke="#a3e635" strokeWidth={2}
                      fill="url(#rev-g)" dot={{ r: 3, fill: "#a3e635", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Orders bar + Status pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-5 border border-border">
                <h2 className="font-semibold mb-0.5">Orders - {rangeLabel}</h2>
                <p className="text-xs text-muted-foreground mb-4">{groupLabel}</p>
                {loading ? <Spinner h={160} /> : !hasChart ? (
                  <NoData msg="No orders in this period" />
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="period" tickFormatter={fmtPeriod}
                        tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                        width={25} allowDecimals={false} />
                      <Tooltip formatter={(v: any) => [v, t("dashboard.orders")]} labelFormatter={fmtPeriod}
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                      <Bar dataKey="orders" fill="#a3e635" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-card rounded-2xl p-5 border border-border">
                <h2 className="font-semibold mb-0.5">Order status</h2>
                <p className="text-xs text-muted-foreground mb-4">Distribution - {rangeLabel}</p>
                {loading ? <Spinner h={160} /> : !hasPie ? (
                  <NoData msg="No orders to show status for" />
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                          innerRadius={30} outerRadius={55} paddingAngle={2}>
                          {pieData.map((_: any, i: number) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {pieData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{entry.name}</span>
                          <span className="font-semibold">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent orders - full width, clean table */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent orders</h2>
                <Link href="/orders"
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {loading ? <Spinner h={100} /> : recent.length === 0 ? (
                <NoData
                  msg="No orders yet"
                  detail="Orders appear here as soon as customers place them through the storefront."
                />
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[580px]">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        {[t("dashboard.orderId"),t("dashboard.customer"),t("auth.phone"),t("dashboard.total"),t("users.status"),t("users.joined"),""].map((h) => (
                          <th key={h} className="pb-2 pr-4 font-medium first:pl-1">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((order) => (
                        <tr key={order.id}
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-3 pr-4 font-mono text-[11px] text-muted-foreground pl-1">
                            #{order.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="py-3 pr-4 font-medium">{order.fullName || "-"}</td>
                          <td className="py-3 pr-4 font-mono text-xs">{order.phone || "-"}</td>
                          <td className="py-3 pr-4 font-semibold whitespace-nowrap">
                            {fmtMoney(Number(order.totalAmount))}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[order.status] || "bg-muted text-muted-foreground border border-border"}`}>
                              {STATUS_ICON[order.status]}
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                            {fmtDateTime(order.createdAt)}
                          </td>
                          <td className="py-3">
                            <Link href="/orders"
                              className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                              View <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Realtime + Users (1/3 width) */}
          <div className="xl:col-span-1 flex flex-col gap-4">

            {/* Realtime block */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-400" />
                </span>
                <h2 className="font-semibold text-sm">Realtime</h2>
                <span className="text-[10px] text-muted-foreground ml-auto">Last 48h</span>
              </div>

              {loading ? <Spinner h={220} /> : (
                <div className="space-y-4">
                  {/* 4 e-commerce metric tiles */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <ShoppingBag className="w-3.5 h-3.5 text-lime-400" />,   value: fmtNum(rt?.itemsSold    ?? 0), label: "products sold"  },
                      { icon: <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />, value: fmtNum(rt?.orders       ?? 0), label: "orders"         },
                      { icon: <TrendingUp   className="w-3.5 h-3.5 text-blue-400" />,   value: fmtNum(rt?.revenue      ?? 0), label: "sum revenue"    },
                      { icon: <Users        className="w-3.5 h-3.5 text-orange-400" />, value: fmtNum(rt?.uniqueBuyers ?? 0), label: t("dashboard.uniqueBuyers") },
                    ].map((m) => (
                      <div key={m.label}
                        className={`rounded-xl border border-border p-3 ${!hasRt ? "bg-muted/5 opacity-55" : "bg-muted/20"}`}>
                        <div className="mb-1.5">{m.icon}</div>
                        <p className="text-xl font-bold leading-none tabular-nums">{m.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Zero state - structure always visible */}
                  {!hasRt && (
                    <p className="text-[11px] text-muted-foreground/50 text-center">
                      No orders in the last 48 hours
                    </p>
                  )}

                  {/* 48h bar chart - all 48 hourly slots always present via generate_series */}
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                      Orders per hour - last 48h
                    </p>
                    {rtChart.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={72}>
                          <BarChart data={rtChart} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                            <XAxis dataKey="period" tickFormatter={rtFmtP}
                              tick={{ fontSize: 8 }} tickLine={false} axisLine={false} interval={11} />
                            <Tooltip
                              formatter={(v: any) => [v, t("dashboard.orders")]} labelFormatter={rtFmtP}
                              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                            />
                            <Bar dataKey="orders" fill="#a3e635" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5 px-1">
                          <span>-48h</span><span>Now</span>
                        </div>
                      </>
                    ) : (
                      <div className="h-16 rounded-xl bg-muted/15 border border-dashed border-border flex items-center justify-center">
                        <p className="text-[10px] text-muted-foreground">No activity data</p>
                      </div>
                    )}
                  </div>

                  {/* Top 3 products in 48h */}
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Top products - 48h
                    </p>
                    {hasRtTop ? (
                      <div className="space-y-2">
                        {rt.topProducts.map((p: any, i: number) => {
                          const imgSrc = resolveImage(p.imageUrl);
                          return (
                            <div key={i}
                              className="flex items-center gap-3 rounded-xl bg-muted/20 border border-border p-3">
                              <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                {imgSrc
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={imgSrc} alt={p.name}
                                      className="w-full h-full object-contain p-0.5"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                  : <Package className="w-4 h-4 text-muted-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{p.name}</p>
                                {p.flavorName && (
                                  <p className="text-[10px] text-muted-foreground/70 truncate">{p.flavorName}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {p.qty} {p.qty === 1 ? "purchase" : "purchases"}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-primary shrink-0 tabular-nums">{p.qty}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-muted/10 border border-dashed border-border p-4 text-center">
                        <p className="text-[11px] text-muted-foreground">No product sales in last 48h</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Users block */}
            <div className="bg-card rounded-2xl border border-border flex flex-col">
              {/* Header: total count */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Total Users</p>
                  <p className="text-2xl font-bold leading-tight tabular-nums">
                    {loading ? "..." : fmtNum(stats?.totalUsers ?? 0)}
                  </p>
                  {!loading && (stats?.totalUsers ?? 0) === 0 && (
                    <p className="text-[10px] text-muted-foreground/50">No users registered yet</p>
                  )}
                </div>
                <Link href="/users"
                  className="ml-auto text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Recently joined list */}
              <div className="p-4 flex-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Recently joined
                  </p>
                </div>
                {loading ? <Spinner h={80} /> : recentUsers.length === 0 ? (
                  <NoData msg="No users yet" detail="Users appear after registration on the storefront." />
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((user) => {
                      const initials = (user.fullName || user.phone || "?")
                        .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                      const avatarBg = ["#a3e635","#22d3ee","#818cf8","#fb923c","#f87171","#34d399","#f472b6"][
                        user.id.charCodeAt(0) % 7
                      ];
                      const joinedAt = fmtRelative(user.createdAt);
                      return (
                        <div key={user.id} className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-black shrink-0"
                            style={{ background: avatarBg }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{user.fullName || user.phone}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{user.phone}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-muted-foreground">{joinedAt}</p>
                            {user.role !== "USER" && (
                              <p className="text-[9px] font-bold text-primary uppercase tracking-wide">{user.role}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
