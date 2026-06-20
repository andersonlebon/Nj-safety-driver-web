"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { chartColors } from "./theme";
import { formatChartValue, type ValueFormat } from "./formats";
import { useChartTheme } from "./useChartTheme";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export type DonutChartCardProps = {
  data: DonutSlice[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  /** How to format the tooltip slice value (paired with the percentage). */
  valueFormat?: ValueFormat;
  ariaLabel?: string;
};

export default function DonutChartCardInner({
  data,
  height = 220,
  centerLabel,
  centerValue,
  valueFormat = "number",
  ariaLabel,
}: DonutChartCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = total > 0;
  const theme = useChartTheme();
  const emptyFill = theme.isDark ? chartColors.gridDark : chartColors.grid;
  const fmtValue = (v: number | string) => formatChartValue(v, valueFormat);

  return (
    <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={theme.tooltipStyle}
            formatter={(value, name) => {
              const num = Number(value);
              return [
                `${fmtValue(num)} (${total > 0 ? Math.round((num / total) * 100) : 0}%)`,
                String(name ?? ""),
              ];
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{
              fontSize: "0.75rem",
              paddingTop: "0.5rem",
              color: theme.label,
            }}
          />
          <Pie
            data={
              hasData
                ? data
                : [{ label: "No data", value: 1, color: emptyFill }]
            }
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={hasData && data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {(hasData
              ? data
              : [{ label: "No data", value: 1, color: emptyFill }]
            ).map((slice, idx) => (
              <Cell key={idx} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="-mt-[calc(50%+0.5rem)] pointer-events-none flex flex-col items-center justify-center text-center">
          {centerValue && (
            <p className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {centerValue}
            </p>
          )}
          {centerLabel && (
            <p className="text-xs text-stone-500 dark:text-slate-400">
              {centerLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
