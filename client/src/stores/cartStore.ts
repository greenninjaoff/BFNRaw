import {
  CartStoreActionsType,
  CartStoreStateType,
  AddToCartInput,
} from "@/types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useCartStore = create<CartStoreStateType & CartStoreActionsType>()(
  persist(
    (set) => ({
      cart: [],
      hasHydrated: false,

      addToCart: (item: AddToCartInput) =>
        set((state) => {
          const qty = item.quantity ?? 1;

          const existingIndex = state.cart.findIndex(
            (p) => p.productId === item.productId && p.sku === item.sku
          );

          if (existingIndex !== -1) {
            const updatedCart = [...state.cart];
            updatedCart[existingIndex].quantity += qty;
            return { cart: updatedCart };
          }

          return {
            cart: [
              ...state.cart,
              {
                ...item,
                quantity: qty,
              },
            ],
          };
        }),

      removeFromCart: ({ productId, sku }) =>
        set((state) => ({
          cart: state.cart.filter((p) => !(p.productId === productId && p.sku === sku)),
        })),

      updateQuantity: ({ productId, sku }, quantity) =>
        set((state) => ({
          cart: state.cart.map((p) =>
            p.productId === productId && p.sku === sku
              ? { ...p, quantity: Math.max(1, quantity) }
              : p
          ),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);

export default useCartStore;