import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "brand" | "gold" | "navy" | "red" | "stone";

const accentStyles: Record<Accent, { iconBg: string; ring: string }> = {
  brand: {
    iconBg:
      "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400",
    ring: "ring-brand-600/10 dark:ring-brand-500/15",
  },
  gold: {
    iconBg:
      "bg-gold-50 text-gold-700 dark:bg-gold-950/50 dark:text-gold-400",
    ring: "ring-gold-600/10 dark:ring-gold-500/15",
  },
  navy: {
    iconBg:
      "bg-navy-50 text-navy-700 dark:bg-navy-950/50 dark:text-navy-300",
    ring: "ring-navy-700/10 dark:ring-navy-500/15",
  },
  red: {
    iconBg:
      "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    ring: "ring-red-600/10 dark:ring-red-500/15",
  },
  stone: {
    iconBg:
      "bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300",
    ring: "ring-stone-300/30 dark:ring-slate-700/40",
  },
};

export function KpiCard({
  label,
  value,
  icon,
  hint,
  accent = "brand",
  delta,
  deltaLabel,
  /**
   * If true, a positive delta is rendered in red (e.g. "more unpaid fines" is
   * actually a regression). Defaults to false (positive = green).
   */
  invertDelta = false,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  accent?: Accent;
  delta?: number | null;
  deltaLabel?: string;
  invertDelta?: boolean;
}) {
  const acc = accentStyles[accent];
  const showDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const isUp = showDelta && delta! > 0;
  const isDown = showDelta && delta! < 0;
  const isFlat = showDelta && delta === 0;
  const good = invertDelta ? isDown : isUp;
  const bad = invertDelta ? isUp : isDown;

  const deltaCls = good
    ? "text-brand-700 dark:text-brand-400"
    : bad
      ? "text-red-600 dark:text-red-400"
      : "text-stone-500 dark:text-slate-400";

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500 dark:text-slate-400">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg ring-1",
              acc.iconBg,
              acc.ring
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
          {value}
        </p>
        <div className="mt-1.5 flex items-center gap-2 min-h-[1.25rem]">
          {showDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                deltaCls
              )}
            >
              {isUp ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : isDown ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {isFlat
                ? "0%"
                : `${delta! > 0 ? "+" : ""}${delta!.toFixed(1)}%`}
            </span>
          )}
          {hint && (
            <span className="text-xs text-stone-400 dark:text-slate-500">
              {showDelta && deltaLabel ? deltaLabel : hint}
            </span>
          )}
          {!hint && showDelta && deltaLabel && (
            <span className="text-xs text-stone-400 dark:text-slate-500">
              {deltaLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
