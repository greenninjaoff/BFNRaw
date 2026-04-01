"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { addressesApi } from "@/lib/api";
import { MapPin, Pencil, Trash2, Star, Plus } from "lucide-react";
import { useT } from "@/i18n/t";
import PageHeader from "@/components/PageHeader";
import dynamic from "next/dynamic";
import type { AddressFormData } from "@/components/map/AddressEditorModal";

const AddressEditorModal = dynamic(() => import("@/components/map/AddressEditorModal"), { ssr: false });

type Address = {
  id: string; title?: string; city?: string; street?: string; house?: string;
  apartment?: string; district?: string; landmark?: string;
  deliveryInstructions?: string; lat?: number; lng?: number; isDefault: boolean;
};

export default function LocationsPage() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<Address | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    addressesApi.getAll()
      .then((data: any) => setAddresses(data))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const handleCreate = async (data: AddressFormData) => {
    const created = await addressesApi.create(data);
    setAddresses((prev) => {
      const next = data.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      return [...next, created];
    });
    setShowAdd(false);
  };

  const handleUpdate = async (data: AddressFormData) => {
    if (!editTarget) return;
    const updated = await addressesApi.update(editTarget.id, data);
    setAddresses((prev) => {
      const next = data.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      return next.map((a) => a.id === editTarget.id ? updated : a);
    });
    setEditTarget(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("locations.deleteConfirm"))) return;
    try {
      await addressesApi.remove(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) { setError(e.message); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesApi.setDefault(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch (e: any) { setError(e.message); }
  };

  const getAddressLine = (addr: Address) =>
    [addr.city, addr.street, addr.house].filter(Boolean).join(", ") || t("locations.noDetails");

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="relative">
        <PageHeader title={t("locations.title")} backFallback="/" />
      </div>

      {error && <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-6 w-6 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--btn-bg))] animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.length === 0 && (
            <div className="text-center py-20">
              <MapPin className="w-12 h-12 text-[rgb(var(--muted))] mx-auto mb-4 opacity-30" />
              <p className="text-[rgb(var(--muted))]">{t("locations.noLocations")}</p>
              <p className="text-xs text-[rgb(var(--muted))] opacity-60 mt-1">{t("locations.tapToAdd")}</p>
            </div>
          )}

          {addresses.map((addr) => (
            <div key={addr.id}
              className={`rounded-2xl p-4 border transition ${addr.isDefault ? "bg-[rgb(var(--surface))] border-[rgb(var(--btn-bg))]" : "bg-[rgb(var(--card))] border-[rgb(var(--border))]"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${addr.isDefault ? "bg-[rgb(var(--btn-bg))]/20" : "bg-[rgb(var(--surface))]"}`}>
                  <MapPin className={`w-5 h-5 ${addr.isDefault ? "text-[rgb(var(--btn-bg-hover))]" : "text-[rgb(var(--muted))]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-[rgb(var(--text))] truncate">{addr.title || t("locations.addAddress")}</p>
                    {addr.isDefault && (
                      <span className="text-[10px] font-medium bg-[rgb(var(--btn-bg))]/20 text-[rgb(var(--btn-bg-hover))] rounded-full px-2 py-0.5 shrink-0">{t("locations.default")}</span>
                    )}
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))] truncate">{getAddressLine(addr)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))] hover:text-yellow-500 transition">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setEditTarget(addr)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))] transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[rgb(var(--muted))] hover:text-red-500 hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB - bottom right */}
      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] shadow-xl flex items-center justify-center hover:bg-[rgb(var(--btn-bg-hover))] transition active:scale-95">
        <Plus className="w-6 h-6" />
      </button>

      {showAdd && <AddressEditorModal title={t("locations.addAddress")} onSave={handleCreate} onClose={() => setShowAdd(false)} />}
      {editTarget && (
        <AddressEditorModal title={t("locations.editAddress")} initial={{ ...editTarget, lat: editTarget.lat ? Number(editTarget.lat) : undefined, lng: editTarget.lng ? Number(editTarget.lng) : undefined }}
          onSave={handleUpdate} onClose={() => setEditTarget(null)} />
      )}
    </div>
  );
}
