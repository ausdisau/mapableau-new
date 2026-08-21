import type { AdsMicros } from "@/lib/ads/money/micros";
import { utcDayKey } from "@/lib/ads/auction/pacing";

export type BudgetGateReason =
  | "OK"
  | "DAILY_BUDGET_EXHAUSTED"
  | "LIFETIME_BUDGET_EXHAUSTED"
  | "INSUFFICIENT_WALLET_BALANCE"
  | "WALLET_FROZEN"
  | "WALLET_CLOSED"
  | "CAMPAIGN_INACTIVE"
  | "HOUSE_NO_CHARGE";

export type BudgetGateResult =
  | { eligible: true; reason: "OK" | "HOUSE_NO_CHARGE" }
  | { eligible: false; reason: Exclude<BudgetGateReason, "OK" | "HOUSE_NO_CHARGE"> };

/**
 * Budget / wallet gate before auction entry.
 * Order: POLICY → ELIGIBILITY → BUDGET → PACING → AUCTION
 */
export function evaluateBudgetGate(input: {
  isHouse: boolean;
  campaignStatus: string;
  walletStatus: "ACTIVE" | "FROZEN" | "CLOSED" | null;
  walletAvailableMicros: AdsMicros;
  dailyBudgetMicros: AdsMicros | null | undefined;
  lifetimeBudgetMicros: AdsMicros | null | undefined;
  todaySpendMicros: AdsMicros;
  lifetimeSpendMicros: AdsMicros;
  spendDayKey: string | null | undefined;
  now: Date;
  /** Minimum micros needed to compete (e.g. one impression at reserve/1000). */
  minChargeMicros?: AdsMicros;
}): BudgetGateResult {
  if (input.isHouse) {
    return { eligible: true, reason: "HOUSE_NO_CHARGE" };
  }

  if (input.campaignStatus !== "ACTIVE" && input.campaignStatus !== "APPROVED") {
    return { eligible: false, reason: "CAMPAIGN_INACTIVE" };
  }

  if (input.walletStatus === "FROZEN") {
    return { eligible: false, reason: "WALLET_FROZEN" };
  }
  if (input.walletStatus === "CLOSED" || input.walletStatus == null) {
    return { eligible: false, reason: "WALLET_CLOSED" };
  }

  const dayKey = utcDayKey(input.now);
  const todaySpend =
    input.spendDayKey === dayKey ? input.todaySpendMicros : 0n;

  if (
    input.dailyBudgetMicros != null &&
    input.dailyBudgetMicros > 0n &&
    todaySpend >= input.dailyBudgetMicros
  ) {
    return { eligible: false, reason: "DAILY_BUDGET_EXHAUSTED" };
  }

  if (
    input.lifetimeBudgetMicros != null &&
    input.lifetimeBudgetMicros > 0n &&
    input.lifetimeSpendMicros >= input.lifetimeBudgetMicros
  ) {
    return { eligible: false, reason: "LIFETIME_BUDGET_EXHAUSTED" };
  }

  const minCharge = input.minChargeMicros ?? 1n;
  if (input.walletAvailableMicros < minCharge) {
    return { eligible: false, reason: "INSUFFICIENT_WALLET_BALANCE" };
  }

  return { eligible: true, reason: "OK" };
}
