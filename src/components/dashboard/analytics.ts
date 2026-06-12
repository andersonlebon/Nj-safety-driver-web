/**
 * Pure analytics helpers used by the dashboard pages.
 *
 * No side effects, no Supabase / Next imports — these helpers take already
 * fetched rows and return chart-ready data structures. That keeps the
 * dashboard server components small and the helpers trivially unit-testable.
 *
 * Time-bucketed helpers (`sumByMonth`, `countByWeek`, `countByDay`,
 * `countByMonthByStatus`) emit `label` as a raw ISO string keyed on the
 * bucket's start instant. The chart wrappers turn that into a human-readable
 * tick via the `tickFormat`/`labelFormat` tokens defined in
 * `src/components/charts/formats.ts`. Keeping the analytics output
 * serializable means server components can pass these rows straight to the
 * client chart components without crossing the RSC function-prop boundary.
 */

import type { PaymentStatus } from "@/lib/types/database";

type WithCreatedAt = { created_at: string };
type WithAmount = { fine_amount: number | string };
type WithStatus = { status: PaymentStatus };

export const COMPLIANCE_RULES = {
  unpaidInfractionPenalty: 2,
  minimumAllowedToDrive: 50,
} as const;

/** Returns the first day of the month for `date`, at 00:00:00 local time. */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns the date at 00:00:00 local time. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Returns the start of the ISO-ish week (Monday). */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Sum `fine_amount` per month across the last `months` months (inclusive of
 * the current month). Missing months are filled with zero so the line chart
 * shows a continuous timeline.
 *
 * `label` is the ISO string for the first day of the month; the client chart
 * formats it (`tickFormat="month"` / `labelFormat="month"`).
 */
export function sumByMonth<T extends WithCreatedAt & WithAmount>(
  rows: T[],
  months: number
): Array<{ label: string; value: number }> {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = startOfMonth(addMonths(now, -i));
    buckets.set(d.toISOString(), 0);
  }
  for (const row of rows) {
    const dt = new Date(row.created_at);
    const key = startOfMonth(dt).toISOString();
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + Number(row.fine_amount));
  }
  return Array.from(buckets.entries()).map(([iso, value]) => ({
    label: iso,
    value,
  }));
}

/**
 * Count rows per week (Monday start) across the last `weeks` weeks.
 * `label` is the ISO string for the Monday of each week.
 */
export function countByWeek<T extends WithCreatedAt>(
  rows: T[],
  weeks: number
): Array<{ label: string; value: number }> {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = startOfWeek(addDays(now, -i * 7));
    buckets.set(d.toISOString(), 0);
  }
  for (const row of rows) {
    const key = startOfWeek(new Date(row.created_at)).toISOString();
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([iso, value]) => ({
    label: iso,
    value,
  }));
}

/**
 * Count rows per day (local TZ) across the last `days` days.
 * `label` is the ISO string for 00:00 of each day.
 */
export function countByDay<T extends WithCreatedAt>(
  rows: T[],
  days: number
): Array<{ label: string; value: number }> {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(addDays(now, -i));
    buckets.set(d.toISOString(), 0);
  }
  for (const row of rows) {
    const key = startOfDay(new Date(row.created_at)).toISOString();
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([iso, value]) => ({
    label: iso,
    value,
  }));
}

/**
 * Count rows per month split by status across the last `months` months.
 * `label` is the ISO string for the first day of each month.
 *
 *   [{ label: "2026-01-01T00:00:00.000Z", paid: 3, unpaid: 1, pending: 2 }, ...]
 */
export function countByMonthByStatus<
  T extends WithCreatedAt & WithStatus,
>(
  rows: T[],
  months: number
): Array<{ label: string; paid: number; unpaid: number; pending: number }> {
  const now = new Date();
  const order: string[] = [];
  const buckets = new Map<
    string,
    { paid: number; unpaid: number; pending: number }
  >();
  for (let i = months - 1; i >= 0; i--) {
    const d = startOfMonth(addMonths(now, -i));
    const k = d.toISOString();
    order.push(k);
    buckets.set(k, { paid: 0, unpaid: 0, pending: 0 });
  }
  for (const row of rows) {
    const key = startOfMonth(new Date(row.created_at)).toISOString();
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket[row.status] += 1;
  }
  return order.map((iso) => {
    const b = buckets.get(iso)!;
    return { label: iso, ...b };
  });
}

/** Group + count by an arbitrary key, return the top N sorted desc. */
export function topN<T>(
  rows: T[],
  key: (row: T) => string | null | undefined,
  n: number
): Array<{ label: string; value: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

/** Percentage delta between two non-negative numbers, rounded to 1 decimal. */
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null; // undefined growth from zero — show no delta rather than +Infinity
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function totalsByPaymentStatus<T extends WithAmount & WithStatus>(
  rows: T[]
): Record<PaymentStatus, number> {
  return rows.reduce<Record<PaymentStatus, number>>(
    (totals, row) => {
      totals[row.status] += Number(row.fine_amount);
      return totals;
    },
    { paid: 0, pending: 0, unpaid: 0 }
  );
}

/**
 * Compute a 0–100 compliance score for a driver:
 *   start at 100
 *   −2 per unpaid infraction
 * Paid infractions restore those points. Transaction states (initialized /
 * pending / paid / unpaid) are displayed separately and only change the
 * infraction when the transaction is confirmed paid.
 * Clamped to [0, 100].
 */
export function computeComplianceScore(args: {
  infractions: Array<{ status: PaymentStatus }>;
  vehicles?: Array<{ insurance_status: boolean; inspection_status: boolean }>;
}): number {
  let score = 100;
  for (const i of args.infractions) {
    if (i.status === "unpaid") score -= COMPLIANCE_RULES.unpaidInfractionPenalty;
  }
  return Math.max(0, Math.min(100, score));
}
