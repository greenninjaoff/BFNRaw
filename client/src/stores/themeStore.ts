"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

function setThemeCookie(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000`;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => {
        setThemeCookie(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const cur = get().theme;
        const next = cur === "dark" ? "light" : "dark";
        setThemeCookie(next);
        set({ theme: next });
      },
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useThemeStore;
