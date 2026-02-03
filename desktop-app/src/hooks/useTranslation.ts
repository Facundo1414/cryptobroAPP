import { useLanguageStore } from "@/stores/language-store";
import es from "@/locales/es.json";
import en from "@/locales/en.json";

type TranslationKey = string;
type Translations = typeof es;

const translations: Record<"es" | "en", Translations> = {
  es,
  en,
};

/**
 * Hook for translations
 * Usage:
 *   const { t } = useTranslation();
 *   t('dashboard.title')  // => "Dashboard"
 *   t('dashboard.portfolioValue')  // => "Valor del Portafolio"
 */
export function useTranslation() {
  const { language, setLanguage } = useLanguageStore();

  const t = (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    // Navigate through nested keys
    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        // Key not found, return the key itself as fallback
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // If value is not a string, return key
    if (typeof value !== "string") {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace parameters in the string (e.g., "vs {{value}} sem anterior")
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  return {
    t,
    language,
    setLanguage,
  };
}

/**
 * Helper function to get translation without hook (for use outside components)
 */
export function getTranslation(
  key: TranslationKey,
  lang: "es" | "en" = "es",
): string {
  const keys = key.split(".");
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = value[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}
