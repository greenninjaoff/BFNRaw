"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { Home, ChevronRight, Pencil } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { addressesApi } from "@/lib/api";
import type { AddressFormData } from "@/components/map/AddressEditorModal";

const AddressEditorModal = dynamic(() => import("@/components/map/AddressEditorModal"), { ssr: false });

const lineInput =
  "w-full border-0 border-b border-[rgb(var(--border))] bg-transparent py-3 text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--muted))] transition";

const AddressBlock = () => {
  const t = useT();
  const address = useCheckoutStore((s) => s.address);
  const savedAddresses = useCheckoutStore((s) => s.savedAddresses);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const setSavedAddresses = useCheckoutStore((s) => s.setSavedAddresses);
  const selectSavedAddress = useCheckoutStore((s) => s.selectSavedAddress);
  const open = useCheckoutStore((s) => s.open);
  const entrance = useCheckoutStore((s) => s.entrance);
  const setEntrance = useCheckoutStore((s) => s.setEntrance);
  const floor = useCheckoutStore((s) => s.floor);
  const setFloor = useCheckoutStore((s) => s.setFloor);
  const apartment = useCheckoutStore((s) => s.apartment);
  const setApartment = useCheckoutStore((s) => s.setApartment);
  const doorCode = useCheckoutStore((s) => s.doorCode);
  const setDoorCode = useCheckoutStore((s) => s.setDoorCode);

  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
  // Build a descriptive subtitle from address fields
  const addressDetail = selectedAddr
    ? [selectedAddr.street, selectedAddr.house, selectedAddr.apartment].filter(Boolean).join(", ")
    : "";
  const cityLine = selectedAddr?.city || selectedAddr?.district || "";

  const handleEditAddress = async (data: AddressFormData) => {
    if (!editingAddress) return;
    const updated = await addressesApi.update(editingAddress.id, data);
    const updatedList = savedAddresses.map((a) =>
      a.id === editingAddress.id
        ? { ...a, title: updated.title || a.title, city: updated.city, street: updated.street, house: updated.house, apartment: updated.apartment, lat: updated.lat, lng: updated.lng }
        : a
    );
    setSavedAddresses(updatedList);
    selectSavedAddress(editingAddress.id);
    setEditingAddress(null);
  };

  return (
    <>
      <div className="px-4 py-4">
        <h2 className="mb-4 text-xl font-bold text-[rgb(var(--text))]">{t("checkout.whereToDeliver")}</h2>

        <div className="flex items-center gap-2">
          {/* Main address selector */}
          <button type="button" onClick={() => open("address")}
            className="flex flex-1 items-center justify-between py-2 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--surface))] shrink-0">
                <Home className="h-4 w-4 text-[rgb(var(--muted))]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[rgb(var(--text))] leading-tight truncate">
                  {selectedAddr?.title || address || t("checkout.selectAddress")}
                </p>
                {addressDetail && (
                  <p className="text-xs text-[rgb(var(--muted))] mt-0.5 truncate">{addressDetail}</p>
                )}
                {cityLine && !addressDetail && (
                  <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{cityLine}</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[rgb(var(--muted))] shrink-0 ml-2" />
          </button>

          {/* Edit selected address button */}
          {selectedAddr && (
            <button
              type="button"
              onClick={() => setEditingAddress(selectedAddr)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--surface))] hover:bg-[rgb(var(--border))] transition shrink-0"
            >
              <Pencil className="h-4 w-4 text-[rgb(var(--muted))]" />
            </button>
          )}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-8">
          <div>
            <p className="text-xs text-[rgb(var(--muted))] mt-3 mb-1">{t("checkout.entrance")}</p>
            <input type="text" value={entrance} onChange={(e) => setEntrance(e.target.value)} placeholder="-" className={lineInput} />
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--muted))] mt-3 mb-1">{t("checkout.doorPhone")}</p>
            <input type="text" value={doorCode} onChange={(e) => setDoorCode(e.target.value)} placeholder="-" className={lineInput} />
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--muted))] mt-4 mb-1">{t("checkout.aptOffice")}</p>
            <input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="-" className={lineInput} />
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--muted))] mt-4 mb-1">{t("checkout.floor")}</p>
            <input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="-" className={lineInput} />
          </div>
        </div>
      </div>

      {/* Edit address modal */}
      {editingAddress && (
        <AddressEditorModal
          title={t("locations.editAddress")}
          initial={{
            id: editingAddress.id,
            title: editingAddress.title || "",
            city: editingAddress.city || "",
            street: editingAddress.street || "",
            house: editingAddress.house || "",
            apartment: editingAddress.apartment || "",
            lat: editingAddress.lat ? Number(editingAddress.lat) : undefined,
            lng: editingAddress.lng ? Number(editingAddress.lng) : undefined,
            isDefault: editingAddress.isDefault,
          }}
          onSave={handleEditAddress}
          onClose={() => setEditingAddress(null)}
        />
      )}
    </>
  );
};

export default AddressBlock;
