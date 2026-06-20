"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors } from "./theme";
import { formatChartValue, type ValueFormat } from "./formats";
import { useChartTheme } from "./useChartTheme";

type Point = { label: string; value: number };

export type LineChartCardProps = {
  data: Point[];
  height?: number;
  color?: string;
  /** How to format numeric Y-axis ticks and tooltip values. */
  valueFormat?: ValueFormat;
  /** How to format the X-axis category ticks (raw label is assumed to be e.g. an ISO date). */
  tickFormat?: ValueFormat;
  /** How to format the tooltip header. Defaults to `tickFormat`. */
  labelFormat?: ValueFormat;
  tooltipSeriesName?: string;
  ariaLabel?: string;
};

export default function LineChartCardInner({
  data,
  height = 240,
  color = chartColors.brand,
  valueFormat = "raw",
  tickFormat = "raw",
  labelFormat,
  tooltipSeriesName = "Total",
  ariaLabel,
}: LineChartCardProps) {
  const theme = useChartTheme();
  const fmtValue = (v: number | string) => formatChartValue(v, valueFormat);
  const fmtTick = (v: number | string) => formatChartValue(v, tickFormat);
  const fmtLabel = (v: number | string) =>
    formatChartValue(v, labelFormat ?? tickFormat);

  return (
    <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="lineFillBrand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.grid}
            vertical={false}
          />
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
            width={56}
            tickFormatter={fmtValue}
          />
          <Tooltip
            contentStyle={theme.tooltipStyle}
            formatter={(value) => [fmtValue(Number(value)), tooltipSeriesName]}
            labelFormatter={(label) => fmtLabel(label as string)}
            cursor={{ stroke: theme.label, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#lineFillBrand)"
            activeDot={{ r: 5, strokeWidth: 0, fill: color }}
            dot={{ r: 3, strokeWidth: 0, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
