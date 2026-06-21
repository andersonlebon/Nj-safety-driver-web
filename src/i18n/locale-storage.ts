import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

export const LOCALE_STORAGE_KEY = "nj_locale";

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(value) ? value : null;
}

export function persistLocale(locale: Locale): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

/** Persist locale and reload so server components pick up the new language. */
export function activateLocale(locale: Locale): void {
  persistLocale(locale);
  window.location.reload();
}
