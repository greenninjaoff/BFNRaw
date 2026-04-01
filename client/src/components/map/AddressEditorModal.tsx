"use client";

import { useState, useEffect, useRef } from "react";
import { useT } from "@/i18n/t";
import { X, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { PickedLocation } from "./AddressMap";

const AddressMap = dynamic(() => import("./AddressMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[rgb(var(--surface))] flex items-center justify-center rounded-2xl">
      <span className="h-5 w-5 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--btn-bg))] animate-spin" />
    </div>
  ),
});

export interface AddressFormData {
  id?: string;
  title: string;
  city?: string;
  district?: string;
  street?: string;
  house?: string;
  apartment?: string;
  landmark?: string;
  deliveryInstructions?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

interface Props {
  initial?: Partial<AddressFormData>;
  onSave: (data: AddressFormData) => Promise<void>;
  onClose: () => void;
  title?: string;
}

const inputCls =
  "w-full h-11 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--btn-bg))] placeholder:text-[rgb(var(--muted))] transition";

async function searchAddresses(q: string) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
      { headers: { "User-Agent": "BefitNutritionApp/1.0" } }
    );
    return r.json() as Promise<Array<{ lat: string; lon: string; display_name: string }>>;
  } catch { return []; }
}

export default function AddressEditorModal({ initial = {}, onSave, onClose, title = "Add address" }: Props) {
  const t = useT();
  const [form, setForm] = useState<AddressFormData>({
    title: initial.title || "",
    city: initial.city || "",
    district: initial.district || "",
    street: initial.street || "",
    house: initial.house || "",
    apartment: initial.apartment || "",
    landmark: initial.landmark || "",
    deliveryInstructions: initial.deliveryInstructions || "",
    lat: initial.lat,
    lng: initial.lng,
    isDefault: initial.isDefault ?? false,
  });
  const [pickedAddress, setPickedAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: keyof AddressFormData, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Every time map location changes → autofill street (always fresh, never stale)
  const handleMapPick = (loc: PickedLocation) => {
    setPickedAddress(loc.displayName);
    setForm((p) => ({ ...p, lat: loc.lat, lng: loc.lng, street: loc.displayName }));
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchAddresses(q);
      setSearchResults(results);
      setSearching(false);
    }, 450);
  };

  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const name = result.display_name.split(",").slice(0, 3).join(",").trim();
    setSearchQuery(name);
    setSearchResults([]);
    setPickedAddress(name);
    setForm((p) => ({ ...p, lat, lng, street: name }));
    // Pan map
    const el = mapContainerRef.current?.querySelector("[data-map]") as any;
    el?.__flyTo?.(lat, lng);
    // Place marker via exposed fn
    const mc = mapContainerRef.current?.querySelector("[data-map-container]") as any;
    mc?.__placeMarker?.(lat, lng);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError(t("locations.labelRequired")); return; }
    if (!form.lat || !form.lng) { setError(t("locations.locationRequired")); return; }
    setError(""); setSaving(true);
    try { await onSave(form); }
    catch (err: any) { setError(err.message || t("errors.failedToSave")); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[rgb(var(--bg))]">
      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))] shrink-0">
        <button type="button" onClick={onClose}
          className="w-9 h-9 rounded-full bg-[rgb(var(--surface))] flex items-center justify-center text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] transition">
          <X className="w-4 h-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2>
        </span>
        <div className="w-9" />
      </div>

      {/* ── Map (takes remaining height) ── */}
      <div ref={mapContainerRef} className="flex-1 relative min-h-0">
        <AddressMap
          initialLat={form.lat}
          initialLng={form.lng}
          onLocationPick={handleMapPick}
        />

        {/* Search bar overlay - top of map */}
        <div className="absolute top-3 left-3 right-16 z-[1000]">
          <div className={`flex items-center gap-2 bg-[rgb(var(--bg))] rounded-2xl shadow-xl px-4 py-2.5 border transition ${searchResults.length > 0 ? "border-[rgb(var(--btn-bg))] rounded-b-none" : "border-[rgb(var(--border))]"}`}>
            {searching
              ? <Loader2 className="w-4 h-4 text-[rgb(var(--muted))] animate-spin shrink-0" />
              : <Search className="w-4 h-4 text-[rgb(var(--muted))] shrink-0" />}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("locations.searchAddress")}
              className="flex-1 bg-transparent text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="bg-[rgb(var(--bg))] border border-[rgb(var(--btn-bg))] border-t-0 rounded-b-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button key={i} type="button" onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-4 py-2.5 text-sm text-[rgb(var(--text))] hover:bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))] last:border-0 transition">
                  {r.display_name.split(",").slice(0, 3).join(",")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tap hint */}
        {!form.lat && (
          <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none z-[999]">
            <div className="bg-[rgb(var(--bg))]/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
              <p className="text-sm font-medium text-[rgb(var(--text))]">Tap map to choose location</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom form panel ── */}
      <div className="bg-[rgb(var(--bg))] border-t border-[rgb(var(--border))] shrink-0 max-h-[55vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-4 pt-4 pb-2 space-y-3">
            {/* Picked address display */}
            {pickedAddress && (
              <div className="text-xs text-[rgb(var(--muted))] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[rgb(var(--btn-bg))] shrink-0" />
                <span className="truncate">{pickedAddress}</span>
              </div>
            )}

            {/* Label */}
            <div>
              <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1 block">
                Label <span className="text-red-400">*</span>
              </label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder={t("locations.labelPlaceholder")} className={inputCls} />
            </div>

            {/* City */}
            <div>
              <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1 block">{t("locations.city")}</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)}
                placeholder="Tashkent" className={inputCls} />
            </div>

            {/* Additional details toggle */}
            <button type="button" onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--btn-bg-hover))] hover:opacity-80 transition py-1">
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Additional details
            </button>

            {showDetails && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1 block">{t("checkout.aptOffice")}</label>
                    <input value={form.apartment} onChange={(e) => set("apartment", e.target.value)} placeholder="24" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1 block">{t("locations.houseBuilding")}</label>
                    <input value={form.house} onChange={(e) => set("house", e.target.value)} placeholder="7A" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1 block">{t("locations.district")}</label>
                    <input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder={t("common.city")} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1 block">{t("locations.landmark")}</label>
                    <input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder={t("checkout.landmark")} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1 block">{t("locations.deliveryInstructions")}</label>
                  <input value={form.deliveryInstructions} onChange={(e) => set("deliveryInstructions", e.target.value)}
                    placeholder={t("checkout.instructionsPlaceholder")} className={inputCls} />
                </div>
              </div>
            )}

            {/* Default toggle */}
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <button type="button" onClick={() => set("isDefault", !form.isDefault)}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.isDefault ? "bg-[rgb(var(--btn-bg))]" : "bg-[rgb(var(--border))]"}`}>
                <span className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-all ${form.isDefault ? "left-5" : "left-[2px]"}`} />
              </button>
              <span className="text-sm text-[rgb(var(--text))]">Set as default</span>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="sticky bottom-0 px-4 py-3 bg-[rgb(var(--bg))] border-t border-[rgb(var(--border))]">
            <button type="submit" disabled={saving}
              className="w-full h-12 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] font-semibold text-sm transition hover:bg-[rgb(var(--btn-bg-hover))] disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : t("locations.saveAddress")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
