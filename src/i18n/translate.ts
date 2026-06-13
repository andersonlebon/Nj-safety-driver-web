import type { Messages } from "@/i18n/messages/en";

export type TranslationKey = string;

export function createTranslator(messages: Messages) {
  return function t(
    key: TranslationKey,
    params?: Record<string, string | number>
  ): string {
    const parts = key.split(".");
    let value: unknown = messages;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") return key;
    if (!params) return value;

    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) =>
        result.replaceAll(`{${paramKey}}`, String(paramValue)),
      value
    );
  };
}

export type Translator = ReturnType<typeof createTranslator>;
