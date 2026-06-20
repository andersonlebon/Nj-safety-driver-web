"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";
import type { DonutChartCardProps, DonutSlice } from "./DonutChartCardInner";

export type { DonutSlice };

const DonutChartCardInner = dynamic(() => import("./DonutChartCardInner"), {
  ssr: false,
  loading: () => <ChartSkeleton height={220} />,
});

export function DonutChartCard(props: DonutChartCardProps) {
  return <DonutChartCardInner {...props} />;
}
