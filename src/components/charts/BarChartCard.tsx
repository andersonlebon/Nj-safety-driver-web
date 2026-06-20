"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";
import type { BarChartCardProps } from "./BarChartCardInner";

const BarChartCardInner = dynamic(() => import("./BarChartCardInner"), {
  ssr: false,
  loading: () => <ChartSkeleton height={240} />,
});

export function BarChartCard(props: BarChartCardProps) {
  return <BarChartCardInner {...props} />;
}
