export const ADMIN_STREAM_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/admin/stream";
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("admin-auth");
    return raw ? JSON.parse(raw)?.state?.token ?? null : null;
  } catch { return null; }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as any) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const adminApi = {
  // Dashboard
  getStats: (range?: string) => req<any>(`/api/admin/stats${range ? `?range=${range}` : ""}`),
  getRecentOrders: () => req<any[]>("/api/admin/recent-orders"),
  getRevenueAnalytics: (period?: string) => req<any[]>(`/api/admin/analytics/revenue${period ? `?period=${period}` : ""}`),
  getRecentUsers: () => req<any[]>("/api/admin/recent-users"),
  getProductsAnalytics: (range?: string) => req<any>(`/api/admin/products-analytics${range ? `?range=${range}` : ""}`),

  // Orders
  getOrders: (p?: { status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (p?.status) qs.set("status", p.status);
    if (p?.limit) qs.set("limit", String(p.limit));
    return req<any[]>(`/api/orders?${qs}`);
  },
  updateOrderStatus: (id: string, status: string) =>
    req<any>(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Products - always use admin=1 to get all (including inactive) with full variants
  getProducts: (p?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams({ admin: "1" });
    if (p?.category) qs.set("category", p.category);
    if (p?.search) qs.set("search", p.search);
    return req<any[]>(`/api/products?${qs}`);
  },
  createProduct: (data: any) => req<any>("/api/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => req<any>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id: string) => req<any>(`/api/products/${id}`, { method: "DELETE" }),
  createFlavor: (productId: string, data: any) =>
    req<any>(`/api/products/${productId}/flavors`, { method: "POST", body: JSON.stringify(data) }),
  updateFlavor: (productId: string, flavorId: string, data: any) =>
    req<any>(`/api/products/${productId}/flavors/${flavorId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteFlavor: (productId: string, flavorId: string) =>
    req<any>(`/api/products/${productId}/flavors/${flavorId}`, { method: "DELETE" }),

  // Categories
  getCategories: () => req<any[]>("/api/categories"),
  createCategory: (data: any) => req<any>("/api/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => req<any>(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCategory: (id: string) => req<any>(`/api/categories/${id}`, { method: "DELETE" }),

  // Users
  getUsers: (p?: { search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (p?.search) qs.set("search", p.search);
    if (p?.limit) qs.set("limit", String(p.limit));
    return req<{ users: any[]; total: number }>(`/api/users?${qs}`);
  },
  getUser: (id: string) => req<any>(`/api/users/${id}`),
  updateUser: (id: string, data: any) => req<any>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  blockUser: (id: string, isBlocked: boolean) =>
    req<any>(`/api/users/${id}/block`, { method: "PATCH", body: JSON.stringify({ isBlocked }) }),

  // Settings
  getSettings: () => req<Record<string, string>>("/api/admin/settings"),
  updateSettings: (settings: Record<string, string>) =>
    req<any>("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ settings }) }),

  // Promo Codes
  getPromoCodes: () => req<any[]>("/api/admin/promo-codes"),
  createPromoCode: (data: any) => req<any>("/api/admin/promo-codes", { method: "POST", body: JSON.stringify(data) }),
  updatePromoCode: (id: string, data: any) =>
    req<any>(`/api/admin/promo-codes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePromoCode: (id: string) => req<any>(`/api/admin/promo-codes/${id}`, { method: "DELETE" }),

  // Notifications broadcast
  sendNotification: (data: { type?: string; title: string; message: string; userIds?: string[] }) =>
    req<{ sent: number }>("/api/admin/notify", { method: "POST", body: JSON.stringify(data) }),
};
