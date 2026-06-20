"use client";

/** Placeholder shown while a chart's recharts chunk is being fetched. */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-stone-100 dark:bg-slate-800/60"
      style={{ height }}
      aria-hidden
    />
  );
}
