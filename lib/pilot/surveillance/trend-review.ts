import { aggregateSignalsByType, type SignalPoint } from "@/lib/pilot/surveillance/signal-aggregation";

export type TrendReview = {
  risingTypes: string[];
  summary: string;
};

export function reviewSignalTrends(
  previous: readonly SignalPoint[],
  current: readonly SignalPoint[]
): TrendReview {
  const prev = aggregateSignalsByType(previous);
  const curr = aggregateSignalsByType(current);
  const risingTypes: string[] = [];
  for (const [type, count] of Object.entries(curr)) {
    if (count > (prev[type] ?? 0)) risingTypes.push(type);
  }
  return {
    risingTypes,
    summary:
      risingTypes.length === 0
        ? "No rising signal types"
        : `Rising: ${risingTypes.join(", ")}`,
  };
}
