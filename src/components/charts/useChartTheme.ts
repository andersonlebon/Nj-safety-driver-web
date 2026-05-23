"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useTheme } from "next-themes";
import { chartColors } from "./theme";

/**
 * Narrowly-typed presentational props for recharts <XAxis/YAxis tick={...}>.
 * Recharts' TickProp is union'd with SVGTextElement props, so the wider
 * React.CSSProperties is incompatible; we expose only what we actually set.
 */
type TickStyle = { fontSize: string; fill: string };

/**
 * Theme-aware chart styling. Recharts wants raw colours, so we expose them
 * here as plain values.
 *
 * Hydration safety: until `mounted` flips on the client, `resolvedTheme` is
 * either `undefined` or "system" and the rendered class on <html> may not yet
 * match. We default to the light palette in that window — it matches our
 * default `bg-stone-50` body, so SSR markup and the first client paint agree.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const grid = isDark ? chartColors.gridDark : chartColors.grid;
  const label = isDark ? chartColors.inkMutedDark : chartColors.inkMuted;
  const axis = isDark ? "rgba(148, 163, 184, 0.25)" : chartColors.grid;
  const cursor = isDark
    ? "rgba(148, 163, 184, 0.18)"
    : "rgba(120, 113, 108, 0.08)";

  const labelStyle: TickStyle = {
    fontSize: "0.7rem",
    fill: label,
  };

  const tooltipStyle: CSSProperties = {
    backgroundColor: isDark
      ? "rgba(15, 23, 42, 0.96)"
      : "rgba(255, 255, 255, 0.96)",
    border: `1px solid ${
      isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(120, 113, 108, 0.2)"
    }`,
    borderRadius: "0.5rem",
    color: isDark ? chartColors.inkDark : chartColors.ink,
    fontSize: "0.75rem",
    padding: "0.5rem 0.75rem",
    boxShadow: "0 8px 24px 0 rgb(0 0 0 / 0.18)",
  };

  return {
    isDark,
    grid,
    axis,
    label,
    cursor,
    labelStyle,
    tooltipStyle,
  };
}
