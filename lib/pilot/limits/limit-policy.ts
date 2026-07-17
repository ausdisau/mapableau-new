import { assertNonNegativeCents, assertPositiveCents } from "@/lib/ndis-gateway/billing/money";

export type PilotLimitConfig = {
  maxTransactionCents: number;
  maxDailyExposureCents: number;
  maxParticipantExposureCents: number;
  maxTotalExposureCents: number;
};

export type ExposureCounters = {
  reservedCents: number;
  committedCents: number;
  dailyCommittedCents: number;
  participantReservedCents: number;
  participantCommittedCents: number;
};

/** Zero max = deny (fail closed for unbounded exposure). */
export function assertWithinTransactionLimit(
  maxTransactionCents: number,
  amountCents: number
): void {
  assertPositiveCents(amountCents);
  assertNonNegativeCents(maxTransactionCents, "maxTransaction");
  if (maxTransactionCents <= 0) {
    throw new Error("MAX_TRANSACTION_CENTS_ZERO_DENY");
  }
  if (amountCents > maxTransactionCents) {
    throw new Error(
      `TRANSACTION_EXCEEDS_LIMIT:${amountCents}>${maxTransactionCents}`
    );
  }
}

export function assertExposureHeadroom(input: {
  limits: PilotLimitConfig;
  counters: ExposureCounters;
  amountCents: number;
}): void {
  const { limits, counters, amountCents } = input;
  assertPositiveCents(amountCents);

  if (limits.maxTotalExposureCents <= 0) {
    throw new Error("MAX_TOTAL_EXPOSURE_ZERO_DENY");
  }
  if (limits.maxDailyExposureCents <= 0) {
    throw new Error("MAX_DAILY_EXPOSURE_ZERO_DENY");
  }
  if (limits.maxParticipantExposureCents <= 0) {
    throw new Error("MAX_PARTICIPANT_EXPOSURE_ZERO_DENY");
  }

  const projectedTotal =
    counters.reservedCents + counters.committedCents + amountCents;
  if (projectedTotal > limits.maxTotalExposureCents) {
    throw new Error(
      `TOTAL_EXPOSURE_EXCEEDED:${projectedTotal}>${limits.maxTotalExposureCents}`
    );
  }

  const projectedDaily = counters.dailyCommittedCents + amountCents;
  if (projectedDaily > limits.maxDailyExposureCents) {
    throw new Error(
      `DAILY_EXPOSURE_EXCEEDED:${projectedDaily}>${limits.maxDailyExposureCents}`
    );
  }

  const projectedParticipant =
    counters.participantReservedCents +
    counters.participantCommittedCents +
    amountCents;
  if (projectedParticipant > limits.maxParticipantExposureCents) {
    throw new Error(
      `PARTICIPANT_EXPOSURE_EXCEEDED:${projectedParticipant}>${limits.maxParticipantExposureCents}`
    );
  }
}

/** Pure reservation math helper for tests and services (integer cents). */
export function computeReservationBalances(input: {
  reservedCents: number;
  committedCents: number;
  amountCents: number;
  action: "reserve" | "commit" | "release";
}): { reservedCents: number; committedCents: number } {
  const amount = assertPositiveCents(input.amountCents);
  let reserved = assertNonNegativeCents(input.reservedCents, "reserved");
  let committed = assertNonNegativeCents(input.committedCents, "committed");

  switch (input.action) {
    case "reserve":
      reserved += amount;
      break;
    case "commit":
      if (reserved < amount) {
        throw new Error("COMMIT_EXCEEDS_RESERVED");
      }
      reserved -= amount;
      committed += amount;
      break;
    case "release":
      if (reserved < amount) {
        throw new Error("RELEASE_EXCEEDS_RESERVED");
      }
      reserved -= amount;
      break;
    default: {
      const _exhaustive: never = input.action;
      throw new Error(`UNKNOWN_RESERVATION_ACTION:${String(_exhaustive)}`);
    }
  }

  return { reservedCents: reserved, committedCents: committed };
}
