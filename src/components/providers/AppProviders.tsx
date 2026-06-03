"use client";

import type { ReactNode } from "react";
import { ChunkLoadRecovery } from "@/components/ChunkLoadRecovery";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { GabonBackdrop } from "@/components/theme/GabonBackdrop";

/**
 * Client-side providers for the app shell. Keeps next-themes on <html> without
 * fighting Next.js font variable classes (those live on <body>).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ChunkLoadRecovery />
      <GabonBackdrop variant="prominent">{children}</GabonBackdrop>
    </ThemeProvider>
  );
}
