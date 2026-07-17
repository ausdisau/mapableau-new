import type { AuraOutcomeSignal } from "@prisma/client";

/**
 * Outcome calibration. Declining a suggestion is NOT a failure — it is a
 * first-class outcome. AURA never performs online self-updates from outcome
 * signals; the calibration file is exported for out-of-band evaluation.
 */

export interface OutcomeSample {
  executionId: string;
  signal: AuraOutcomeSignal;
  narrative?: string | null;
}

export interface OutcomeSummary {
  total: number;
  confirmedSuccess: number;
  partialSuccess: number;
  declinedByParticipant: number;
  noActionNeeded: number;
  regression: number;
  failure: number;
  waitingEvidence: number;
  successRate: number;
  declineRate: number;
}

export function summariseOutcomes(samples: OutcomeSample[]): OutcomeSummary {
  const summary: OutcomeSummary = {
    total: samples.length,
    confirmedSuccess: 0,
    partialSuccess: 0,
    declinedByParticipant: 0,
    noActionNeeded: 0,
    regression: 0,
    failure: 0,
    waitingEvidence: 0,
    successRate: 0,
    declineRate: 0,
  };
  for (const s of samples) {
    switch (s.signal) {
      case "confirmed_success":
        summary.confirmedSuccess += 1;
        break;
      case "partial_success":
        summary.partialSuccess += 1;
        break;
      case "declined_by_participant":
        summary.declinedByParticipant += 1;
        break;
      case "no_action_needed":
        summary.noActionNeeded += 1;
        break;
      case "regression":
        summary.regression += 1;
        break;
      case "failure":
        summary.failure += 1;
        break;
      case "waiting_evidence":
        summary.waitingEvidence += 1;
        break;
      default: {
        const _exhaustive: never = s.signal;
        throw new Error(`Unhandled outcome signal: ${_exhaustive}`);
      }
    }
  }
  if (summary.total > 0) {
    summary.successRate =
      (summary.confirmedSuccess + summary.partialSuccess) / summary.total;
    summary.declineRate = summary.declinedByParticipant / summary.total;
  }
  return summary;
}

/** No online update: signals inform humans, never the model itself. */
export function isOnlineSelfUpdateAllowed(): false {
  return false;
}
