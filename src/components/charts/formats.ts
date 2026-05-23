/**
 * Serializable formatting tokens for chart components.
 *
 * Why tokens instead of `(v: number) => string` props?
 *
 * The dashboard pages under `src/app/{driver,agent,admin}` are React Server
 * Components. Passing a function prop across the RSC boundary into a client
 * component (`LineChartCard`, `BarChartCard`, `DonutChartCard`, `ScoreGauge`)
 * throws at runtime:
 *
 *   Functions cannot be passed directly to Client Components unless you
 *   explicitly expose it with "use server".
 *
 * Instead, callers pass a `ValueFormat` string token and the actual
 * formatting logic lives here, inside the client wrappers.
 *
 * NOTE: the file deliberately doesn't carry "use client". It contains no
 * React state/hooks — it's a pure helper that's safe to import from either
 * server or client modules, though in practice only the chart wrappers use
 * it. Locale is hardcoded ("en-US") so SSR and the first client paint emit
 * identical strings (avoids hydration mismatches on date labels).
 */

import { formatCurrency } from "@/lib/utils";

export type ValueFormat =
  | "currency"
  | "currency-short"
  | "number"
  | "percent"
  | "month"
  | "date"
  | "week"
  | "raw";

const LOCALE = "en-US";

const numberFormatter = new Intl.NumberFormat(LOCALE);
const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  year: "2-digit",
});
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
});

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" && value.length > 0) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/** ISO-8601 week number (Mon-start). */
function isoWeek(date: Date): number {
  const t = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Format a single chart value according to the given token. Used by both
 * axis tick formatters and tooltip formatters inside the chart wrappers.
 */
export function formatChartValue(
  value: number | string | null | undefined,
  format: ValueFormat = "raw"
): string {
  if (value === null || value === undefined || value === "") return "";

  switch (format) {
    case "currency":
      return formatCurrency(Number(value));

    case "currency-short": {
      const n = Number(value);
      const abs = Math.abs(n);
      if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
      if (abs >= 1_000) return `${Math.round(n / 1_000)}k FCFA`;
      return formatCurrency(n);
    }

    case "number":
      return numberFormatter.format(Number(value));

    case "percent":
      return `${Math.round(Number(value))}%`;

    case "month": {
      const d = parseDate(value);
      return d ? monthFormatter.format(d) : String(value);
    }

    case "date": {
      const d = parseDate(value);
      return d ? dateFormatter.format(d) : String(value);
    }

    case "week": {
      const d = parseDate(value);
      return d ? `W${isoWeek(d)}` : String(value);
    }

    case "raw":
    default:
      return String(value);
  }
}
