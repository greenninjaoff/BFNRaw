"use client";

import { create } from "zustand";

export type DeliveryType = "standard" | "priority";
export type PaymentMethod = "card" | "payme" | "click" | "cash";

export type SheetType =
  | "address"
  | "promo"
  | "phone"
  | "courier"
  | "card"
  | null;

export type SavedCard = {
  id: string;
  maskedNumber: string;
  holder?: string;
  brand?: string;
};

export type SavedAddress = {
  id: string;
  title: string;
  subtitle?: string;
  city?: string;
  district?: string;
  street?: string;
  house?: string;
  apartment?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
};

type PriceDetails = {
  itemsTotal: number;
  deliveryFee: number;
  serviceFee: number;
  priorityFee: number;
  total: number;
};

type CheckoutStore = {
  // delivery
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;

  // saved addresses
  savedAddresses: SavedAddress[];
  setSavedAddresses: (addresses: SavedAddress[]) => void;
  addSavedAddress: (address: SavedAddress) => void;
  removeSavedAddress: (id: string) => void;
  updateSavedAddress: (id: string, data: Partial<SavedAddress>) => void;

  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  selectSavedAddress: (id: string) => void;


  startEditAddress: (id: string) => void;
  startNewAddress: () => void;

  // selected address details
  address: string | null;
  entrance: string;
  floor: string;
  apartment: string;
  doorCode: string;

  setAddress: (value: string) => void;
  setEntrance: (value: string) => void;
  setFloor: (value: string) => void;
  setApartment: (value: string) => void;
  setDoorCode: (value: string) => void;

  // courier
  courierInstructions: string;
  setCourierInstructions: (value: string) => void;

  // phone
  phone: string;
  setPhone: (value: string) => void;

  // options
  leaveAtDoor: boolean;
  toggleLeaveAtDoor: () => void;
  setLeaveAtDoor: (value: boolean) => void;

  // promo
  promoCode: string;
  setPromoCode: (value: string) => void;
  promoDiscount: number;
  setPromoDiscount: (value: number) => void;

  // payment
  paymentMethod: PaymentMethod;
  setPaymentMethod: (value: PaymentMethod) => void;

  savedCards: SavedCard[];
  setSavedCards: (cards: SavedCard[]) => void;
  addSavedCard: (card: SavedCard) => void;
  removeSavedCard: (id: string) => void;

  selectedCardId: string | null;
  setSelectedCardId: (id: string | null) => void;

  isAddingNewCard: boolean;
  setIsAddingNewCard: (value: boolean) => void;

  selectSavedCard: (id: string) => void;
  selectAddNewCard: () => void;
  selectPayme: () => void;
  selectClick: () => void;
  selectCash: () => void;

  needChange: boolean;
  toggleNeedChange: () => void;
  setNeedChange: (value: boolean) => void;

  changeAmount: string;
  setChangeAmount: (value: string) => void;

  // price
  itemsTotal: number;
  deliveryFee: number;
  serviceFee: number;
  priorityFee: number;
  total: number;
  setPriceDetails: (data: PriceDetails) => void;

  // ui
  openSheet: SheetType;
  open: (sheet: SheetType) => void;
  close: () => void;

  // utils
  resetCheckout: () => void;
};

const initialState = {
  deliveryType: "standard" as DeliveryType,
  savedAddresses: [] as SavedAddress[],
  selectedAddressId: null as string | null,
  address: null as string | null,
  entrance: "",
  floor: "",
  apartment: "",
  doorCode: "",
  courierInstructions: "",
  phone: "",
  leaveAtDoor: false,
  promoCode: "",
  promoDiscount: 0,
  paymentMethod: "card" as PaymentMethod,
  savedCards: [] as SavedCard[],
  selectedCardId: null as string | null,
  isAddingNewCard: true,
  needChange: false,
  changeAmount: "",
  itemsTotal: 0,
  deliveryFee: 0,
  serviceFee: 0,
  priorityFee: 0,
  total: 0,
  openSheet: null as SheetType,
};

const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  ...initialState,

  setDeliveryType: (type) => set({ deliveryType: type }),

  setSavedAddresses: (addresses) =>
    set((state) => {
      const still = addresses.find((a) => a.id === state.selectedAddressId);
      if (still) return { savedAddresses: addresses, address: still.title };
      if (!addresses.length) return { savedAddresses: addresses, selectedAddressId: null, address: null };
      return { savedAddresses: addresses, selectedAddressId: addresses[0].id, address: addresses[0].title };
    }),

  addSavedAddress: (a) => set((s) => ({ savedAddresses: [...s.savedAddresses, a] })),

  removeSavedAddress: (id) =>
    set((state) => {
      const next = state.savedAddresses.filter((a) => a.id !== id);
      if (state.selectedAddressId !== id) return { savedAddresses: next };
      if (!next.length) return { savedAddresses: next, selectedAddressId: null, address: null };
      return { savedAddresses: next, selectedAddressId: next[0].id, address: next[0].title };
    }),

  updateSavedAddress: (id, data) =>
    set((state) => ({
      savedAddresses: state.savedAddresses.map((a) => a.id === id ? { ...a, ...data } : a),
      ...(state.selectedAddressId === id && data.title ? { address: data.title } : {}),
    })),

  setSelectedAddressId: (id) => set({ selectedAddressId: id }),

  selectSavedAddress: (id) => {
    const selected = get().savedAddresses.find((a) => a.id === id);
    set({ selectedAddressId: id, address: selected?.title ?? null });
  },


  startEditAddress: (id) => {
    set({ selectedAddressId: id, openSheet: "address" });
  },
  startNewAddress: () => {
    set({ openSheet: "address" });
  },

  setAddress: (value) => set({ address: value }),
  setEntrance: (value) => set({ entrance: value }),
  setFloor: (value) => set({ floor: value }),
  setApartment: (value) => set({ apartment: value }),
  setDoorCode: (value) => set({ doorCode: value }),

  setCourierInstructions: (value) => set({ courierInstructions: value }),
  setPhone: (value) => set({ phone: value }),

  toggleLeaveAtDoor: () => set((s) => ({ leaveAtDoor: !s.leaveAtDoor })),
  setLeaveAtDoor: (value) => set({ leaveAtDoor: value }),

  setPromoCode: (value) => set({ promoCode: value }),
  setPromoDiscount: (value) => set({ promoDiscount: value }),

  setPaymentMethod: (value) => set({ paymentMethod: value }),

  setSavedCards: (cards) =>
    set((state) => {
      const still = state.selectedCardId && cards.find((c) => c.id === state.selectedCardId);
      if (still) return { savedCards: cards, isAddingNewCard: false };
      if (!cards.length) return { savedCards: cards, selectedCardId: null, isAddingNewCard: true };
      return { savedCards: cards, selectedCardId: null, isAddingNewCard: true };
    }),

  addSavedCard: (card) => set((s) => ({ savedCards: [...s.savedCards, card] })),

  removeSavedCard: (id) =>
    set((state) => {
      const next = state.savedCards.filter((c) => c.id !== id);
      if (state.selectedCardId !== id) return { savedCards: next };
      return { savedCards: next, selectedCardId: null, isAddingNewCard: true, paymentMethod: "card" as PaymentMethod };
    }),

  setSelectedCardId: (id) => set({ selectedCardId: id }),
  setIsAddingNewCard: (value) => set({ isAddingNewCard: value }),

  selectSavedCard: (id) =>
    set({ paymentMethod: "card", selectedCardId: id, isAddingNewCard: false, needChange: false, changeAmount: "" }),

  selectAddNewCard: () =>
    set({ paymentMethod: "card", selectedCardId: null, isAddingNewCard: true, needChange: false, changeAmount: "" }),

  selectPayme: () =>
    set({ paymentMethod: "payme", selectedCardId: null, isAddingNewCard: false, needChange: false, changeAmount: "" }),

  selectClick: () =>
    set({ paymentMethod: "click", selectedCardId: null, isAddingNewCard: false, needChange: false, changeAmount: "" }),

  selectCash: () =>
    set({ paymentMethod: "cash", selectedCardId: null, isAddingNewCard: false }),

  setNeedChange: (value) => set({ needChange: value }),
  toggleNeedChange: () => set((s) => ({ needChange: !s.needChange, changeAmount: s.needChange ? "" : s.changeAmount })),
  setChangeAmount: (value) => set({ changeAmount: value }),

  setPriceDetails: (data) => set(data),

  open: (sheet) => set({ openSheet: sheet }),
  close: () => set({ openSheet: null }),

  resetCheckout: () => set({ ...initialState }),
}));

export default useCheckoutStore;
