"use client";
import useAdminLangStore from "@/stores/adminLangStore";
import { fmtDate } from "@/lib/tz";

import { resolveImage } from "@/lib/imageUtils";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";
import { adminApi } from "@/lib/api";
import {
  ArrowLeft, Calendar, ShoppingBag, TrendingUp,
  MapPin, CreditCard, CheckCircle, Package, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";

const fmt = (n: number | string) => Number(n).toLocaleString("ru-RU");

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  PAID:      "bg-blue-100 text-blue-800",
  SHIPPED:   "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED:  "bg-muted text-muted-foreground",
};

function colorFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  const colors = ["#a3e635","#22d3ee","#818cf8","#fb923c","#f87171","#34d399","#f472b6","#60a5fa"];
  return colors[Math.abs(h) % colors.length];
}

function UserAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-black shrink-0"
      style={{ width: size, height: size, background: colorFromString(name), fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function EditUserSheet({ user, onSaved }: { user: any; onSaved: () => void }) {
  const { t } = useAdminLangStore();
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role || "USER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try { await adminApi.updateUser(user.id, { fullName: fullName || undefined, phone, role }); onSaved(); }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <SheetContent className="w-full sm:max-w-md">
      <SheetHeader><SheetTitle>{t("common.edit")}</SheetTitle></SheetHeader>
      <ScrollArea className="h-[calc(100vh-80px)] mt-4">
        <form onSubmit={handleSave} className="space-y-4 pr-4 pb-8">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Name" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("auth.phone")} *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? t("common.loading") : t("common.save")}</Button>
          </div>
        </form>
      </ScrollArea>
    </SheetContent>
  );
}

export default function UserDetailPage() {
  const { t, lang } = useAdminLangStore();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.getUser(id)
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const handleBlock = async () => {
    if (!user) return;
    try { await adminApi.blockUser(user.id, !user.isBlocked); load(); }
    catch (e: any) { setError(e.message); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <span className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  );

  if (error || !user) return (
    <div className="py-8 text-center text-muted-foreground">
      <p>{error || t("users.notFound")}</p>
      <Link href="/users" className="text-primary hover:underline text-sm mt-2 block">{t("users.backToList")}</Link>
    </div>
  );

  const displayName = user.fullName || user.phone || "Unknown";

  return (
    <div className="py-4 max-w-4xl space-y-5">
      <Link href="/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      {/* ── Profile card ── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-start gap-4">
          <UserAvatar name={displayName} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " + (user.isBlocked ? "bg-red-100 text-red-700" : user.role === "ADMIN" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {user.isBlocked ? "Blocked" : user.role}
                  </span>
                  {user.isPhoneVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline">{t("common.edit")}</Button>
                  </SheetTrigger>
                  <EditUserSheet user={user} onSaved={() => { setSheetOpen(false); load(); }} />
                </Sheet>
                <Button size="sm" variant={user.isBlocked ? "outline" : "destructive"} onClick={handleBlock}>
                  {user.isBlocked ? t("common.unblock") : t("common.block")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info + stats grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{t("users.joined")}</p>
          <p className="text-sm font-semibold">{fmtDate(user.createdAt, lang)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{t("users.totalOrders")}</p>
          <p className="text-2xl font-bold">{user.orderCount ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{t("users.totalSpent")}</p>
          <p className="text-2xl font-bold">{fmt(user.totalSpent ?? 0)} <span className="text-sm font-normal text-muted-foreground">sum</span></p>
        </div>
      </div>

      {/* ── Saved addresses ── */}
      {user.addresses?.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" /> Saved addresses ({user.addresses.length})
          </h2>
          <div className="space-y-3">
            {user.addresses.map((addr: any) => {
              const line = [addr.city, addr.district, addr.street, addr.house, addr.apartment].filter(Boolean).join(", ");
              const mapsUrl = addr.lat && addr.lng
                ? `https://maps.google.com/?q=${addr.lat},${addr.lng}`
                : line ? `https://maps.google.com/?q=${encodeURIComponent(line)}` : null;
              return (
                <div key={addr.id} className={`flex items-start justify-between gap-3 rounded-xl p-3 border ${addr.isDefault ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{addr.title || t("locations.title")}</p>
                      {addr.isDefault && <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-1.5 py-0.5">{t("users.default")}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{line || "No address details"}</p>
                    {addr.landmark && <p className="text-xs text-muted-foreground italic">{addr.landmark}</p>}
                    {addr.lat && addr.lng && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{Number(addr.lat).toFixed(5)}, {Number(addr.lng).toFixed(5)}</p>
                    )}
                  </div>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline shrink-0 mt-0.5 transition">
                      <ExternalLink className="w-3 h-3" /> Maps
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Saved cards ── */}
      {user.cards?.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" /> Saved cards ({user.cards.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {user.cards.map((card: any) => (
              <div key={card.id} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-mono font-medium">{card.maskedNumber}</p>
                  {card.brand && <p className="text-xs text-muted-foreground">{card.brand}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Order history ── */}
      {user.orders?.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" /> Order history ({user.orders.length})
          </h2>
          <div className="space-y-3">
            {user.orders.map((order: any) => {
              const items = (order.items || []).filter(Boolean);
              return (
                <div key={order.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${STATUS_STYLES[order.status] || "bg-muted text-muted-foreground"}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtDate(order.createdAt, lang)}
                        {" - "}{order.paymentMethod} - {order.deliveryType}
                      </p>
                    </div>
                    <p className="text-sm font-bold shrink-0">{fmt(order.totalAmount)} sum</p>
                  </div>
                  {/* Item images row */}
                  {items.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                          {item.imageSnapshot ? (
                            <img src={resolveImage(item.imageSnapshot)} alt={item.nameSnapshot || ""}
                              className="w-7 h-7 rounded-lg object-contain bg-muted border border-border"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center">
                              <Package className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {item.nameSnapshot}{item.flavorSnapshot ? ` (${item.flavorSnapshot})` : ""} x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {user.orders?.length === 0 && user.addresses?.length === 0 && user.cards?.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No activity yet for this user</p>
        </div>
      )}
    </div>
  );
}
