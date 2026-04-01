const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch { return null; }
}

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const authApi = {
  register: (phone: string, password: string, fullName?: string) =>
    request<{ user: any; token: string }>("/api/auth/register", {
      method: "POST", body: JSON.stringify({ phone, password, fullName }),
    }),
  login: (phone: string, password: string) =>
    request<{ user: any; token: string }>("/api/auth/login", {
      method: "POST", body: JSON.stringify({ phone, password }),
    }),
  me: () => request<any>("/api/auth/me", {}, true),
  updateProfile: (data: { fullName?: string; phone?: string }) =>
    request<any>("/api/auth/me", { method: "PATCH", body: JSON.stringify(data) }, true),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>("/api/auth/change-password", {
      method: "POST", body: JSON.stringify({ currentPassword, newPassword }),
    }, true),
};

export const productsApi = {
  getAll: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    return request<any[]>(`/api/products?${qs}`);
  },
  // Accepts either slug or UUID id
  getOne: (slugOrId: string) => request<any>(`/api/products/${encodeURIComponent(slugOrId)}`),
};

export const categoriesApi = {
  getAll: () => request<any[]>("/api/categories"),
};

export const ADMIN_STREAM_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/admin/stream";

export const ordersApi = {
  getMyOrders: () => request<any[]>("/api/orders/my", {}, true),
  getOne: (id: string) => request<any>(`/api/orders/${id}/detail`, {}, true),
  createOrder: (data: any) =>
    request<any>("/api/orders", { method: "POST", body: JSON.stringify(data) }, true),
  cancelOrder: (id: string) =>
    request<any>(`/api/orders/${id}/cancel`, { method: "POST" }, true),
};

export const addressesApi = {
  getAll: () => request<any[]>("/api/addresses", {}, true),
  create: (data: any) =>
    request<any>("/api/addresses", { method: "POST", body: JSON.stringify(data) }, true),
  update: (id: string, data: any) =>
    request<any>(`/api/addresses/${id}`, { method: "PATCH", body: JSON.stringify(data) }, true),
  remove: (id: string) =>
    request<any>(`/api/addresses/${id}`, { method: "DELETE" }, true),
  setDefault: (id: string) =>
    request<any>(`/api/addresses/${id}/default`, { method: "POST" }, true),
};

export const cardsApi = {
  getAll: () => request<any[]>("/api/cards", {}, true),
  add: (data: { maskedNumber: string; brand?: string; holder?: string }) =>
    request<any>("/api/cards", { method: "POST", body: JSON.stringify(data) }, true),
  remove: (id: string) =>
    request<any>(`/api/cards/${id}`, { method: "DELETE" }, true),
};

export const notificationsApi = {
  getAll: () => request<any[]>("/api/notifications", {}, true),
  markRead: (id: string) =>
    request<any>(`/api/notifications/${id}/read`, { method: "POST" }, true),
  markAllRead: () =>
    request<any>("/api/notifications/read-all", { method: "POST" }, true),
};

export const adminApi = {
  getStats: () => request<any>("/api/admin/stats", {}, true),
  getRecentOrders: () => request<any[]>("/api/admin/recent-orders", {}, true),
  getAllOrders: (params?: { status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    return request<any[]>(`/api/orders?${qs}`, {}, true);
  },
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, true),
  getAllUsers: (params?: { search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<any>(`/api/users?${qs}`, {}, true);
  },
  blockUser: (id: string, isBlocked: boolean) =>
    request<any>(`/api/users/${id}/block`, { method: "PATCH", body: JSON.stringify({ isBlocked }) }, true),
  getAllProducts: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    return request<any[]>(`/api/products?${qs}`, {}, true);
  },
  createProduct: (data: any) =>
    request<any>("/api/products", { method: "POST", body: JSON.stringify(data) }, true),
  updateProduct: (id: string, data: any) =>
    request<any>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }, true),
  deleteProduct: (id: string) =>
    request<any>(`/api/products/${id}`, { method: "DELETE" }, true),
  createFlavor: (productId: string, data: any) =>
    request<any>(`/api/products/${productId}/flavors`, { method: "POST", body: JSON.stringify(data) }, true),
  deleteFlavor: (productId: string, flavorId: string) =>
    request<any>(`/api/products/${productId}/flavors/${flavorId}`, { method: "DELETE" }, true),
  getAllCategories: () => request<any[]>("/api/categories", {}, true),
  createCategory: (data: any) =>
    request<any>("/api/categories", { method: "POST", body: JSON.stringify(data) }, true),
  updateCategory: (id: string, data: any) =>
    request<any>(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }, true),
  deleteCategory: (id: string) =>
    request<any>(`/api/categories/${id}`, { method: "DELETE" }, true),
};

export const passwordResetApi = {
  request: (phone: string) =>
    request<{ success: boolean; code?: string }>("/api/auth/reset/request", {
      method: "POST", body: JSON.stringify({ phone }),
    }),
  confirm: (phone: string, code: string, newPassword: string) =>
    request<{ success: boolean }>("/api/auth/reset/confirm", {
      method: "POST", body: JSON.stringify({ phone, code, newPassword }),
    }),
};

export const settingsApi = {
  get: () => request<Record<string, string>>("/api/settings"),
};

export const adminPromoApi = {
  getAll: () => request<any[]>("/api/admin/promo-codes", {}, true),
  create: (data: any) => request<any>("/api/admin/promo-codes", { method: "POST", body: JSON.stringify(data) }, true),
  update: (id: string, data: any) => request<any>(`/api/admin/promo-codes/${id}`, { method: "PATCH", body: JSON.stringify(data) }, true),
  remove: (id: string) => request<any>(`/api/admin/promo-codes/${id}`, { method: "DELETE" }, true),
};

export const adminSettingsApi = {
  get: () => request<Record<string, string>>("/api/admin/settings", {}, true),
  update: (settings: Record<string, string>) =>
    request<any>("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ settings }) }, true),
};

export const promoApi = {
  validate: (code: string, subtotal: number) =>
    request<{ valid: boolean; code?: string; discountType?: string; discountValue?: number; discountAmount?: number; error?: string }>(
      "/api/promo/validate",
      { method: "POST", body: JSON.stringify({ code, subtotal }) }
    ),
};
