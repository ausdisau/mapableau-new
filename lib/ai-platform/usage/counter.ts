/**
 * Per-envelope usage counters. Kept lightweight; the real counter lives in
 * the database but this pure helper is enough to check caps in isolation.
 */

export interface UsageWindow {
  sessionCalls: number;
  dayCalls: number;
  totalSpendDollars: number;
}

export interface UsageDelta {
  additionalCalls?: number;
  additionalSpendDollars?: number;
}

export function applyUsage(current: UsageWindow, delta: UsageDelta): UsageWindow {
  return {
    sessionCalls: current.sessionCalls + (delta.additionalCalls ?? 0),
    dayCalls: current.dayCalls + (delta.additionalCalls ?? 0),
    totalSpendDollars:
      current.totalSpendDollars + (delta.additionalSpendDollars ?? 0),
  };
}

export function withinCaps(
  usage: UsageWindow,
  caps: {
    perSessionCallCap: number | null;
    perDayCallCap: number | null;
    envelopeSpendCap: number | null;
  }
): { ok: true } | { ok: false; reason: string } {
  if (
    caps.perSessionCallCap !== null &&
    usage.sessionCalls > caps.perSessionCallCap
  ) {
    return { ok: false, reason: "session_cap_exceeded" };
  }
  if (caps.perDayCallCap !== null && usage.dayCalls > caps.perDayCallCap) {
    return { ok: false, reason: "day_cap_exceeded" };
  }
  if (
    caps.envelopeSpendCap !== null &&
    usage.totalSpendDollars > caps.envelopeSpendCap
  ) {
    return { ok: false, reason: "spend_cap_exceeded" };
  }
  return { ok: true };
}
