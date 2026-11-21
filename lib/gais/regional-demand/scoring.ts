import type {
  GaisDemandIndicator,
  GaisDemandIndicatorKey,
  RegionalStrategyResult,
} from "@/lib/gais/regional-demand/contracts";

export type RegionalDemandWeights = Record<GaisDemandIndicatorKey, number>;

export const DEFAULT_REGIONAL_DEMAND_WEIGHTS: RegionalDemandWeights = {
  participantScale: 0.3,
  growth: 0.2,
  providerScarcity: 0.2,
  marketConcentration: 0.1,
  paymentIntensity: 0.1,
  accessNeed: 0.1,
};

const DEMAND_SIDE: ReadonlySet<GaisDemandIndicatorKey> = new Set([
  "participantScale",
  "growth",
  "paymentIntensity",
  "accessNeed",
]);

const SUPPLY_SIDE: ReadonlySet<GaisDemandIndicatorKey> = new Set([
  "providerScarcity",
  "marketConcentration",
]);

export function percentileNormalize(
  values: Array<number | null>,
): Array<number | null> {
  const numeric = values
    .map((value, index) => ({ value, index }))
    .filter(
      (entry): entry is { value: number; index: number } =>
        typeof entry.value === "number" && Number.isFinite(entry.value),
    );

  if (numeric.length === 0) return values.map(() => null);
  if (numeric.length === 1) {
    return values.map((value) => (value === null ? null : 0.5));
  }

  const sorted = [...numeric].sort((a, b) => a.value - b.value);
  const normalizedByIndex = new Map<number, number>();

  let start = 0;
  while (start < sorted.length) {
    let end = start;
    while (end + 1 < sorted.length && sorted[end + 1].value === sorted[start].value) {
      end += 1;
    }

    const averageRank = ((start + 1) + (end + 1)) / 2;
    const percentile = (averageRank - 1) / (sorted.length - 1);

    for (let i = start; i <= end; i += 1) {
      normalizedByIndex.set(sorted[i].index, percentile);
    }
    start = end + 1;
  }

  return values.map((value, index) =>
    value === null ? null : (normalizedByIndex.get(index) ?? null),
  );
}

export function computeRegionalStrategyScore(
  indicators: GaisDemandIndicator[],
  weights: RegionalDemandWeights = DEFAULT_REGIONAL_DEMAND_WEIGHTS,
): RegionalStrategyResult {
  const available = indicators.filter(
    (indicator) =>
      typeof indicator.normalizedValue === "number" &&
      Number.isFinite(indicator.normalizedValue),
  );

  const presentKeys = new Set(available.map((indicator) => indicator.key));
  const weightCoverage = Object.entries(weights).reduce(
    (total, [key, weight]) =>
      presentKeys.has(key as GaisDemandIndicatorKey) ? total + weight : total,
    0,
  );

  const hasDemand = available.some((indicator) => DEMAND_SIDE.has(indicator.key));
  const hasSupply = available.some((indicator) => SUPPLY_SIDE.has(indicator.key));

  if (weightCoverage < 0.7 || !hasDemand || !hasSupply) {
    return {
      strategyScore: null,
      scoreAvailability: "insufficient_data",
      weightCoverage,
      weightsVersion: "v1",
    };
  }

  const weightedTotal = available.reduce(
    (total, indicator) =>
      total + (indicator.normalizedValue ?? 0) * weights[indicator.key],
    0,
  );

  return {
    strategyScore: weightedTotal / weightCoverage,
    scoreAvailability: "available",
    weightCoverage,
    weightsVersion: "v1",
  };
}
