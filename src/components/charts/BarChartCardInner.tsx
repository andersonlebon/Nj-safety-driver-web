"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartValue, type ValueFormat } from "./formats";
import { useChartTheme } from "./useChartTheme";

type Series = {
  key: string;
  label: string;
  color: string;
  stackId?: string;
};

export type BarChartCardProps = {
  data: Array<Record<string, string | number>>;
  series: Series[];
  height?: number;
  /** "vertical" = bars rise from x-axis (default). "horizontal" = bars stretch right. */
  layout?: "vertical" | "horizontal";
  /** How to format numeric tick + tooltip values (whichever axis carries numbers). */
  valueFormat?: ValueFormat;
  /** How to format the categorical axis ticks (typically a date-ish raw label). */
  tickFormat?: ValueFormat;
  /** How to format the tooltip header. Defaults to `tickFormat`. */
  labelFormat?: ValueFormat;
  showLegend?: boolean;
  ariaLabel?: string;
};

export default function BarChartCardInner({
  data,
  series,
  height = 240,
  layout = "vertical",
  valueFormat = "raw",
  tickFormat = "raw",
  labelFormat,
  showLegend = false,
  ariaLabel,
}: BarChartCardProps) {
  const isHorizontal = layout === "horizontal";
  const theme = useChartTheme();
  const fmtValue = (v: number | string) => formatChartValue(v, valueFormat);
  const fmtTick = (v: number | string) => formatChartValue(v, tickFormat);
  const fmtLabel = (v: number | string) =>
    formatChartValue(v, labelFormat ?? tickFormat);

  return (
    <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          barCategoryGap={isHorizontal ? "20%" : "25%"}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.grid}
            vertical={false}
          />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tick={theme.labelStyle}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtValue}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={theme.labelStyle}
                tickLine={false}
                axisLine={{ stroke: theme.axis }}
                width={120}
                tickFormatter={fmtTick}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tick={theme.labelStyle}
                tickLine={false}
                axisLine={{ stroke: theme.axis }}
                tickFormatter={fmtTick}
              />
              <YAxis
                tick={theme.labelStyle}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={fmtValue}
              />
            </>
          )}
          <Tooltip
            contentStyle={theme.tooltipStyle}
            cursor={{ fill: theme.cursor }}
            formatter={(value, name) => [
              fmtValue(Number(value)),
              String(name ?? ""),
            ]}
            labelFormatter={(label) => fmtLabel(label as string)}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: "0.75rem",
                paddingTop: "0.5rem",
                color: theme.label,
              }}
              iconType="circle"
            />
          )}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              stackId={s.stackId}
              radius={
                s.stackId ? [0, 0, 0, 0] : isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]
              }
              maxBarSize={isHorizontal ? 22 : 36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
