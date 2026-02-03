import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "es" | "en";

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: "es", // Default to Spanish
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "cryptobro-language",
    },
  ),
);
