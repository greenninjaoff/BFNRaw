"use client";

import BottomSheet from "@/components/ui/BottomSheet";
import useCheckoutStore from "@/stores/checkoutStore";
import { addressesApi } from "@/lib/api";
import useAuthStore from "@/stores/authStore";
import { MapPin, Star } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { AddressFormData } from "@/components/map/AddressEditorModal";
import { useT } from "@/i18n/t";

const AddressEditorModal = dynamic(() => import("@/components/map/AddressEditorModal"), { ssr: false });

const AddressSheet = () => {
  const t = useT();
  const openSheet = useCheckoutStore((s) => s.openSheet);
  const close = useCheckoutStore((s) => s.close);
  const savedAddresses = useCheckoutStore((s) => s.savedAddresses);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const selectSavedAddress = useCheckoutStore((s) => s.selectSavedAddress);
  const setSavedAddresses = useCheckoutStore((s) => s.setSavedAddresses);
  const { user } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const isOpen = openSheet === "address";

  const handleSelect = (id: string) => { selectSavedAddress(id); close(); };

  const handleSetDefault = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    setSaving(true);
    try {
      await addressesApi.setDefault(id);
      setSavedAddresses(savedAddresses.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch {} finally { setSaving(false); }
  };

  const handleAddAddress = async (data: AddressFormData) => {
    const created = await addressesApi.create(data);
    const newAddr = {
      id: created.id,
      title: created.title || [created.street, created.house].filter(Boolean).join(", ") || t("common.address"),
      city: created.city || undefined,
      isDefault: created.isDefault,
    };
    setSavedAddresses([...savedAddresses, newAddr as any]);
    selectSavedAddress(created.id);
    setShowAddModal(false); close();
  };

  return (
    <>
      <BottomSheet open={isOpen} onClose={close} title={t("checkout.selectAddress")}>
        <div className="space-y-3">
          {savedAddresses.length === 0 && (
            <p className="text-sm text-[rgb(var(--muted))] text-center py-4">{t("locations.noLocations")}</p>
          )}
          {savedAddresses.map((item) => {
            const active = item.id === selectedAddressId;
            return (
              <button key={item.id} type="button" onClick={() => handleSelect(item.id)}
                className={`flex w-full items-start justify-between rounded-2xl border px-4 py-4 text-left transition ${active ? "border-[rgb(var(--btn-bg))] bg-[rgb(var(--surface))]" : "border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))]"}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--surface))] shrink-0">
                    <MapPin className="h-5 w-5 text-[rgb(var(--muted))]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[rgb(var(--text))] truncate">{item.title}</p>
                    {item.city && <p className="mt-0.5 text-xs text-[rgb(var(--muted))] truncate">{item.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {!item.isDefault && (
                    <button type="button" onClick={(e) => handleSetDefault(e, item.id)} disabled={saving}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgb(var(--surface))] hover:bg-[rgb(var(--border))] transition">
                      <Star className="h-3.5 w-3.5 text-[rgb(var(--muted))]" />
                    </button>
                  )}
                  <div className={`h-5 w-5 rounded-full border-2 ${active ? "border-[rgb(var(--btn-bg))] bg-[rgb(var(--btn-bg))]" : "border-[rgb(var(--border))]"}`} />
                </div>
              </button>
            );
          })}
          <button type="button" onClick={() => setShowAddModal(true)}
            className="mt-2 h-[44px] w-full rounded-2xl bg-[rgb(var(--surface))] text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--border))]">
            + {t("locations.addAddress")}
          </button>
        </div>
      </BottomSheet>

      {showAddModal && (
        <AddressEditorModal
          title={t("checkout.addDeliveryAddress")}
          onSave={handleAddAddress}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
};

export default AddressSheet;
