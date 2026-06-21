"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { defaultLocale, type Locale } from "@/i18n/config";
import {
  activateLocale,
  persistLocale,
  readStoredLocale,
} from "@/i18n/locale-storage";
import { messages } from "@/i18n/messages";
import { createTranslator, type Translator } from "@/i18n/translate";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale = defaultLocale,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const syncedRef = useRef(false);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    const stored = readStoredLocale();
    if (stored && stored !== initialLocale) {
      persistLocale(stored);
      window.location.reload();
      return;
    }

    persistLocale(initialLocale);
  }, [initialLocale]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = messages[locale];
    return {
      locale,
      setLocale: (nextLocale: Locale) => {
        if (nextLocale === locale) return;
        activateLocale(nextLocale);
      },
      t: createTranslator(dictionary),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
