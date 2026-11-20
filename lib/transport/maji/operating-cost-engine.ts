import type { RemainingRouteCostEstimate, TollLineStatus } from "@/types/maji";

export type OperatingCostInputs = {
  remainingDurationSeconds: number;
  remainingDistanceMetres: number;
  centsPerKm: number | null;
  centsPerPaidMinute: number | null;
  energyAllowanceCents?: number | null;
  extraChargesCents?: number | null;
  tollCents: number | null;
  tollLineStatus: TollLineStatus;
  currentTotalRemainingCents?: number | null;
};

function moneyOrNull(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
}

function sumKnownOrNull(parts: Array<number | null>): number | null {
  if (parts.some((part) => part == null)) return null;
  return parts.reduce<number>((sum, part) => sum + (part ?? 0), 0);
}

export function estimateRemainingOperatingCost(
  input: OperatingCostInputs
): RemainingRouteCostEstimate {
  const remainingKm = input.remainingDistanceMetres / 1000;
  const remainingPaidMinutes = input.remainingDurationSeconds / 60;

  const distanceCostCents =
    input.centsPerKm == null
      ? null
      : moneyOrNull(remainingKm * input.centsPerKm);
  const paidDriverTimeCents =
    input.centsPerPaidMinute == null
      ? null
      : moneyOrNull(remainingPaidMinutes * input.centsPerPaidMinute);
  const energyAllowanceCents = moneyOrNull(input.energyAllowanceCents ?? null);
  const extraChargesCents = moneyOrNull(input.extraChargesCents ?? null);
  const tollCents = moneyOrNull(input.tollCents);

  const totalRemainingCents = sumKnownOrNull([
    paidDriverTimeCents,
    distanceCostCents,
    energyAllowanceCents,
    extraChargesCents,
    tollCents,
  ]);

  const currentTotal = moneyOrNull(input.currentTotalRemainingCents ?? null);
  const operatingCostDifferenceCents =
    totalRemainingCents == null || currentTotal == null
      ? null
      : totalRemainingCents - currentTotal;

  return {
    paidDriverTimeCents,
    distanceCostCents,
    energyAllowanceCents,
    tollCents,
    extraChargesCents,
    totalRemainingCents,
    operatingCostDifferenceCents,
    tollLineStatus: input.tollLineStatus,
  };
}
