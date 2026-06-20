"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";
import type { LineChartCardProps } from "./LineChartCardInner";

const LineChartCardInner = dynamic(() => import("./LineChartCardInner"), {
  ssr: false,
  loading: () => <ChartSkeleton height={240} />,
});

export function LineChartCard(props: LineChartCardProps) {
  return <LineChartCardInner {...props} />;
}
