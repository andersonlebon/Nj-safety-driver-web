export const LOCALES = ["en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "nj_locale";

export const defaultLocale: Locale = "fr";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "fr";
}

export function localeLabel(locale: Locale): string {
  return locale === "fr" ? "Français" : "English";
}
