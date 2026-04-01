import { z } from "zod";

export type LocaleKey = "ru" | "uz" | "en";

export type ProductI18n = {
  name?: string;
  description?: string;
  ingredients?: string;
  typeName?: string;
  flavorLabel?: string;
};

export type ProductVariant = {
  sku: string;
  flavorKey?: string;
  netWeight?: string;
  price: number;
  compareAtPrice?: number | null;
  stock?: number;          // available inventory
  isActive?: boolean;
  image?: string;
  i18n: Partial<Record<LocaleKey, ProductI18n>>;
  _flavorId?: string;      // DB uuid for order creation
};

export type ProductType = {
  id: number | string;  // number (legacy) or string (API)
  baseName: string;
  category: string;
  type: string;
  series: string;
  netWeightOptions: string[];
  variants: ProductVariant[];
};

export type CartItemType = {
  productId: number | string;
  sku: string;
  flavorId?: string;     // DB uuid - used for order creation
  quantity: number;

  // snapshot fields for UI
  name: string;
  price: number;
  image?: string;
  netWeight?: string;
  flavorKey?: string;

  // optional metadata
  category?: string;
  type?: string;
  series?: string;
  typeName?: string;
  flavorLabel?: string;
};

export type CartItemsType = CartItemType[];

export type CartStoreStateType = {
  cart: CartItemsType;
  hasHydrated: boolean;
};

export type AddToCartInput = Omit<CartItemType, "quantity"> & {
  quantity?: number;
};

export type CartStoreActionsType = {
  addToCart: (item: AddToCartInput) => void;
  removeFromCart: (item: Pick<CartItemType, "productId" | "sku">) => void;
  updateQuantity: (item: Pick<CartItemType, "productId" | "sku">, quantity: number) => void;
  clearCart: () => void;
};

/* Forms */
export const shippingFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().min(1),
  phone: z.string().min(7).max(10).regex(/^\d+$/),
  address: z.string().min(1),
  city: z.string().min(1),
});
export type ShippingFormInputs = z.infer<typeof shippingFormSchema>;

export const paymentFormSchema = z.object({
  cardHolder: z.string().min(1),
  cardNumber: z.string().min(16).max(16),
  expirationDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  cvv: z.string().min(3).max(3),
});
export type PaymentFormInputs = z.infer<typeof paymentFormSchema>;
