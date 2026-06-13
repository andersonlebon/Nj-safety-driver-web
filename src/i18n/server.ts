import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translate";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getTranslations() {
  const locale = await getLocale();
  const dictionary = messages[locale];
  return {
    locale,
    t: createTranslator(dictionary),
  };
}
