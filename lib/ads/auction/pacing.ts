import { PACING_OVER_SLACK, PACING_SEED_SALT } from "@/lib/ads/auction/config";
import type { AdsMicros } from "@/lib/ads/money/micros";

export type PacingDecision =
  | { enter: true; reason: "UNDER_PACE" | "ON_PACE" | "NO_DAILY_BUDGET" }
  | { enter: false; reason: "OVER_PACE" };

/**
 * Delivery pacing gate — determines auction entry only.
 * Does not increase bids or clearing prices.
 *
 * When materially over pace (actualSpendFraction >
 * elapsedDayFraction * (1 + slack)), throttle via deterministic seed.
 */
export function evaluatePacing(input: {
  dailyBudgetMicros: AdsMicros | null | undefined;
  todaySpendMicros: AdsMicros;
  now: Date;
  campaignId: string;
  /** Optional seed for tests (defaults to campaignId + day key). */
  seed?: string;
  overSlack?: number;
}): PacingDecision {
  const budget = input.dailyBudgetMicros;
  if (budget == null || budget <= 0n) {
    return { enter: true, reason: "NO_DAILY_BUDGET" };
  }

  const elapsed = elapsedUtcDayFraction(input.now);
  const targetSpendFraction = Math.min(1, Math.max(0, elapsed));
  const actualSpendFraction =
    budget > 0n
      ? Number(input.todaySpendMicros) / Number(budget)
      : 0;
  const slack = input.overSlack ?? PACING_OVER_SLACK;
  const threshold = targetSpendFraction * (1 + slack);

  if (actualSpendFraction <= threshold) {
    return {
      enter: true,
      reason: actualSpendFraction <= targetSpendFraction ? "UNDER_PACE" : "ON_PACE",
    };
  }

  // Deterministic throttle: allow a reduced fraction of auctions based on how far over.
  const overRatio = Math.min(
    1,
    (actualSpendFraction - threshold) / Math.max(0.01, threshold),
  );
  const allowProb = Math.max(0.05, 1 - overRatio);
  const seed =
    input.seed ??
    `${PACING_SEED_SALT}:${input.campaignId}:${utcDayKey(input.now)}`;
  const roll = seededUnitInterval(seed);
  if (roll <= allowProb) {
    return { enter: true, reason: "ON_PACE" };
  }
  return { enter: false, reason: "OVER_PACE" };
}

export function elapsedUtcDayFraction(now: Date): number {
  const ms =
    now.getUTCHours() * 3_600_000 +
    now.getUTCMinutes() * 60_000 +
    now.getUTCSeconds() * 1000 +
    now.getUTCMilliseconds();
  return ms / 86_400_000;
}

export function utcDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Deterministic [0,1) from string seed (FNV-1a style). */
export function seededUnitInterval(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0x1_0000_0000;
}
