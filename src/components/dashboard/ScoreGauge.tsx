"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";
import type { ScoreGaugeProps } from "./ScoreGaugeInner";

const ScoreGaugeInner = dynamic(() => import("./ScoreGaugeInner"), {
  ssr: false,
  loading: () => <ChartSkeleton height={220} />,
});

export function ScoreGauge(props: ScoreGaugeProps) {
  return <ScoreGaugeInner {...props} />;
}
