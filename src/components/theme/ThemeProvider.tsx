"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Wraps `next-themes` with the project's defaults:
 *   - attribute="class"           → puts `.dark` on <html>, matching our
 *                                    Tailwind `darkMode: "class"` config
 *   - defaultTheme="system"       → honour the OS preference until the user
 *                                    explicitly toggles
 *   - enableSystem                → still expose "system" as a third option
 *   - disableTransitionOnChange   → avoid flashing transitions during swap
 *
 * Persistence (localStorage) is handled automatically by next-themes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
