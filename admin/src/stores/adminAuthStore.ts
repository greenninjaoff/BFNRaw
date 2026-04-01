"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AdminUser = {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
};

type AdminAuthState = {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

type AdminAuthActions = {
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (v: boolean) => void;
};

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const useAdminAuthStore = create<AdminAuthState & AdminAuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (phone: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Login failed");
          if (!["ADMIN", "SUPERADMIN"].includes(data.user?.role)) {
            throw new Error("Access denied. Admin account required.");
          }
          set({ user: data.user, token: data.token, isLoading: false, error: null });
        } catch (e: any) {
          set({ isLoading: false, error: e.message, user: null, token: null });
          throw e;
        }
      },

      logout: () => set({ user: null, token: null, error: null }),
      clearError: () => set({ error: null }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "admin-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAdminAuthStore;
