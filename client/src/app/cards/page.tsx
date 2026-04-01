"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { cardsApi } from "@/lib/api";
import { useT } from "@/i18n/t";
import PageHeader from "@/components/PageHeader";
import { CreditCard, Plus, Trash2, X } from "lucide-react";

const BRANDS = ["Visa", "MasterCard", "Humo", "UzCard", "Other"];

function maskNumber(digits: string): string {
  return `**** **** **** ${digits.slice(-4).padStart(4, "X")}`;
}

function formatInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function CardForm({ onSave, onClose, t }: { onSave: (d: any) => Promise<void>; onClose: () => void; t: (k: string) => string }) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [brand, setBrand] = useState("Visa");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const digits = number.replace(/\D/g, "");
  const inputCls = "w-full h-12 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--btn-bg))] placeholder:text-[rgb(var(--muted))] transition";

  const handleSave = async () => {
    if (digits.length < 16) { setError(t("cards.cardInvalid")); return; }
    setError(""); setSaving(true);
    try { await onSave({ maskedNumber: maskNumber(digits), brand, holder: holder.trim() || undefined }); }
    catch (e: any) { setError(e.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4">
      <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[rgb(var(--text))]">{t("cards.add")}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[rgb(var(--surface))] flex items-center justify-center hover:bg-[rgb(var(--border))] transition">
            <X className="w-4 h-4 text-[rgb(var(--muted))]" />
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div>
          <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">{t("cards.cardNumber")} *</label>
          <input type="text" inputMode="numeric" maxLength={19} value={formatInput(number)}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="0000 0000 0000 0000" className={`${inputCls} font-mono tracking-widest`} />
          {digits.length >= 4 && (
            <p className="text-xs text-[rgb(var(--muted))] mt-1 font-mono">Saves as: {maskNumber(digits)}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">{t("cards.cardHolder")}</label>
          <input value={holder} onChange={(e) => setHolder(e.target.value.toUpperCase())} placeholder="JOHN DOE" className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block">{t("cards.brand")}</label>
          <div className="flex gap-2 flex-wrap">
            {BRANDS.map((b) => (
              <button key={b} type="button" onClick={() => setBrand(b)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition ${brand === b ? "border-[rgb(var(--btn-bg))] bg-[rgb(var(--surface))]" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || digits.length < 16}
          className="w-full h-12 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] font-semibold text-sm transition hover:bg-[rgb(var(--btn-bg-hover))] disabled:opacity-50 flex items-center justify-center">
          {saving ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : t("cards.add")}
        </button>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const t = useT(); const router = useRouter();
  const { user } = useAuthStore();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    cardsApi.getAll().then(setCards).catch(() => {}).finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const handleAdd = async (data: any) => { const card = await cardsApi.add(data); setCards((p) => [...p, card]); setShowAdd(false); };
  const handleRemove = async (id: string) => {
    if (!window.confirm(t("cards.removeConfirm"))) return;
    await cardsApi.remove(id); setCards((p) => p.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative">
        <PageHeader title={t("cards.title")} backFallback="/account"
          right={<button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-full bg-[rgb(var(--surface))] flex items-center justify-center hover:bg-[rgb(var(--border))] transition"><Plus className="w-4 h-4 text-[rgb(var(--text))]" /></button>} />
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><span className="h-6 w-6 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--btn-bg))] animate-spin" /></div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-[rgb(var(--muted))] mx-auto mb-4 opacity-30" />
          <p className="text-[rgb(var(--muted))] mb-1">{t("cards.none")}</p>
          <p className="text-sm text-[rgb(var(--muted))] opacity-60 mb-4">{t("cards.addHint")}</p>
          <button onClick={() => setShowAdd(true)} className="bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[rgb(var(--btn-bg-hover))] transition">{t("cards.add")}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
              <div className="w-12 h-12 rounded-xl bg-[rgb(var(--surface))] flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5 text-[rgb(var(--muted))]" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-[rgb(var(--text))]">{card.maskedNumber}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{card.brand}{card.holder ? ` · ${card.holder}` : ""}</p>
              </div>
              <button onClick={() => handleRemove(card.id)} className="w-9 h-9 rounded-full bg-[rgb(var(--surface))] flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition text-[rgb(var(--muted))]"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => setShowAdd(true)} className="w-full h-14 rounded-2xl border-2 border-dashed border-[rgb(var(--border))] flex items-center justify-center gap-2 text-[rgb(var(--muted))] hover:border-[rgb(var(--btn-bg))] hover:text-[rgb(var(--text))] transition">
            <Plus className="w-4 h-4" /><span className="text-sm font-medium">{t("cards.add")}</span>
          </button>
        </div>
      )}
      {showAdd && <CardForm onSave={handleAdd} onClose={() => setShowAdd(false)} t={t} />}
    </div>
  );
}
