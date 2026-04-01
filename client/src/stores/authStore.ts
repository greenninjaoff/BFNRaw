"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/lib/api";

export type AuthUser = {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
  isPhoneVerified: boolean;
  isBlocked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateProfile: (data: { fullName?: string; phone?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
};

const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.login(phone, password);
          set({ user, token, isLoading: false });
        } catch (e: any) {
          set({ isLoading: false, error: e.message });
          throw e;
        }
      },

      register: async (phone, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.register(phone, password, fullName);
          set({ user, token, isLoading: false });
        } catch (e: any) {
          set({ isLoading: false, error: e.message });
          throw e;
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      refreshMe: async () => {
        if (!get().token) return;
        try {
          const user = await authApi.me();
          set({ user });
        } catch {
          set({ user: null, token: null });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authApi.updateProfile(data);
          set({ user, isLoading: false });
        } catch (e: any) {
          set({ isLoading: false, error: e.message });
          throw e;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
        } catch (e: any) {
          set({ isLoading: false, error: e.message });
          throw e;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
