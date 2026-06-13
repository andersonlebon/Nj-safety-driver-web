"use client";

import type { ReactNode } from "react";
import { ChunkLoadRecovery } from "@/components/ChunkLoadRecovery";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { GabonBackdrop } from "@/components/theme/GabonBackdrop";
import { I18nProvider } from "@/i18n/context";
import type { Locale } from "@/i18n/config";

/**
 * Client-side providers for the app shell. Keeps next-themes on <html> without
 * fighting Next.js font variable classes (those live on <body>).
 */
export function AppProviders({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return (
    <ThemeProvider>
      <I18nProvider initialLocale={initialLocale}>
        <ChunkLoadRecovery />
        <GabonBackdrop variant="prominent">{children}</GabonBackdrop>
      </I18nProvider>
    </ThemeProvider>
  );
}
