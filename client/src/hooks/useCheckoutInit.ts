"use client";

import { useEffect } from "react";
import useAuthStore from "@/stores/authStore";
import useCheckoutStore from "@/stores/checkoutStore";
import { addressesApi, cardsApi } from "@/lib/api";

export function useCheckoutInit() {
  const { user } = useAuthStore();
  const setSavedAddresses = useCheckoutStore((s) => s.setSavedAddresses);
  const setSavedCards = useCheckoutStore((s) => s.setSavedCards);
  const setPhone = useCheckoutStore((s) => s.setPhone);
  const phone = useCheckoutStore((s) => s.phone);

  useEffect(() => {
    if (!user) return;

    // Pre-fill phone
    if (!phone && user.phone) setPhone(user.phone);

    // Load saved addresses
    addressesApi.getAll()
      .then((addresses: any[]) => {
        const mapped = addresses.map((a) => ({
          id: a.id,
          title: a.title || [a.street, a.house].filter(Boolean).join(", ") || "Address",
          subtitle: a.fullName || undefined,
          city: a.city || undefined,
          district: a.district || undefined,
          street: a.street || undefined,
          house: a.house || undefined,
          apartment: a.apartment || undefined,
          deliveryInstructions: a.deliveryInstructions || undefined,
          isDefault: a.isDefault,
          lat: a.lat != null ? Number(a.lat) : undefined,
          lng: a.lng != null ? Number(a.lng) : undefined,
        }));
        mapped.sort((a: any, b: any) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        setSavedAddresses(mapped);
      })
      .catch(() => {});

    // Load saved cards from DB
    cardsApi.getAll()
      .then((cards: any[]) => {
        setSavedCards(cards.map((c) => ({
          id: c.id,
          maskedNumber: c.maskedNumber,
          brand: c.brand || undefined,
          holder: c.holder || undefined,
        })));
      })
      .catch(() => {});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
}
