"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { chartColors } from "@/components/charts/theme";
import { formatChartValue, type ValueFormat } from "@/components/charts/formats";
import { useChartTheme } from "@/components/charts/useChartTheme";

export type ScoreGaugeProps = {
  /** 0–100 */
  score: number;
  label?: string;
  description?: string;
  height?: number;
  /**
   * How the big centred number is rendered. Defaults to `"raw"` (e.g. "73").
   * Accepted for API symmetry with the other chart wrappers so callers in
   * server components never need to pass a function.
   */
  valueFormat?: ValueFormat;
};

export default function ScoreGaugeInner({
  score,
  label = "Compliance score",
  description,
  height = 220,
  valueFormat = "raw",
}: ScoreGaugeProps) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const color =
    safe >= 80
      ? chartColors.brand
      : safe >= 50
        ? chartColors.gold
        : chartColors.unpaid;
  const { isDark } = useChartTheme();
  const restFill = isDark
    ? "rgba(148, 163, 184, 0.16)"
    : "rgba(120, 113, 108, 0.12)";
  const data = [
    { name: "score", value: safe },
    { name: "rest", value: 100 - safe },
  ];

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={210}
            endAngle={-30}
            innerRadius="70%"
            outerRadius="92%"
            stroke="none"
            isAnimationActive
          >
            <Cell fill={color} />
            <Cell fill={restFill} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <p
          className="text-4xl font-bold tracking-tight"
          style={{ color }}
        >
          {formatChartValue(safe, valueFormat)}
        </p>
        <p className="text-xs font-medium text-stone-500 dark:text-slate-400 uppercase tracking-wider">
          / 100
        </p>
        <p className="mt-1 text-sm font-semibold text-stone-700 dark:text-slate-300">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-[11px] text-stone-400 dark:text-slate-500 max-w-[14rem] leading-tight">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
