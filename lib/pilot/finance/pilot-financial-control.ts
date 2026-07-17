import { assertNonNegativeCents } from "@/lib/ndis-gateway/billing/money";

export type FinancialControlView = {
  reservedCents: number;
  committedCents: number;
  availableTotalCents: number;
  availableDailyCents: number;
};

export function computeFinancialControl(input: {
  maxTotalExposureCents: number;
  maxDailyExposureCents: number;
  reservedCents: number;
  committedCents: number;
  dailyCommittedCents: number;
}): FinancialControlView {
  assertNonNegativeCents(input.reservedCents, "reserved");
  assertNonNegativeCents(input.committedCents, "committed");
  return {
    reservedCents: input.reservedCents,
    committedCents: input.committedCents,
    availableTotalCents: Math.max(
      0,
      input.maxTotalExposureCents - input.reservedCents - input.committedCents
    ),
    availableDailyCents: Math.max(
      0,
      input.maxDailyExposureCents - input.dailyCommittedCents
    ),
  };
}
