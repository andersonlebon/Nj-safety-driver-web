/**
 * Chart palette mirroring the Tailwind brand tokens declared in
 * `tailwind.config.ts`. Recharts wants raw hex / rgb strings, so we re-export
 * the same colours here. Keep this file in sync with the Tailwind config.
 *
 * This module is intentionally side-effect-free and free of React hooks so it
 * can be imported from BOTH server components (e.g. dashboard pages) and
 * client components (chart wrappers). For the theme-aware hook, see
 * `useChartTheme.ts` which lives next to this file.
 */

export const chartColors = {
  // Gabon Forest Green
  brand: "#006b3f",
  brandLight: "#3db57d",
  brandSoft: "#a8e4c7",
  // Gabon Metallic Gold
  gold: "#d4af37",
  goldBright: "#fcd116",
  goldSoft: "#ffe088",
  // Gabon Deep Navy
  navy: "#2d3e82",
  navyLight: "#4b6cb7",
  navySoft: "#c7d2fe",
  // Neutrals (light theme)
  ink: "#1c1917",
  inkMuted: "#78716c",
  grid: "#e7e5e4",
  // Neutrals (dark theme)
  inkDark: "#f8fafc",
  inkMutedDark: "#94a3b8",
  gridDark: "#1f2937",
  // Status
  paid: "#007a48",
  unpaid: "#dc2626",
  pending: "#d4af37",
} as const;

export const statusColor: Record<"paid" | "unpaid" | "pending", string> = {
  paid: chartColors.paid,
  unpaid: chartColors.unpaid,
  pending: chartColors.pending,
};

