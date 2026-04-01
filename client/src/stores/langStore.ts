"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Lang = "en" | "ru" | "uz";

type LangState = {
    lang: Lang;
    setLang: (lang: Lang) => void;
};

const useLangStore = create<LangState>()(
    persist(
        (set) => ({
            lang: "en",
            setLang: (lang) => {
                // save to cookie for server components
                document.cookie = `lang=${lang}; path=/; max-age=31536000`;

                set({ lang });
            },
        }),
        {
            name: "lang",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useLangStore;