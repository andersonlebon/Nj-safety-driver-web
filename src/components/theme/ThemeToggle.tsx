"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A simple 2-state light/dark theme toggle.
 *
 * Why not a 3-state cycle including "system"?
 *   - The provider boots with `defaultTheme="system"` so first-time visitors
 *     already get OS-following behaviour for free. A 2-state toggle is the
 *     polished, friction-free choice once the user wants to override it.
 *
 * Hydration-safety: the icon and aria-label depend on `resolvedTheme`, which
 * is only correct after mount. We render an invisible placeholder of the same
 * size during SSR so the layout doesn't shift, then swap to the real icon on
 * client mount.
 */
export function ThemeToggle({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const nextLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  const sizeCls =
    size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={mounted ? nextLabel : "Toggle theme"}
      title={mounted ? nextLabel : "Toggle theme"}
      onClick={toggleTheme}
      className={cn(
        "relative z-20 inline-flex items-center justify-center rounded-lg border transition-colors",
        "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900",
        "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
        sizeCls,
        className
      )}
    >
      {!mounted ? (
        // Placeholder keeps the button square during SSR / before mount so
        // markup matches and there's no layout shift.
        <span aria-hidden className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
      <span className="sr-only">{mounted ? nextLabel : "Theme toggle"}</span>
    </button>
  );
}
