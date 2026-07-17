/**
 * Wave 11 — Signal correlation.
 *
 * Deterministic (rule-based) correlation of newly-recorded ContinuitySignals
 * with existing ContinuityCases and downstream graph impact. No opaque
 * scoring, no ML thresholds — just explicit precedence rules that a
 * coordinator can audit.
 */

import type { ContinuitySignal, ContinuitySignalKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isSignalDestructivelyUsable } from "@/lib/continuity/signals/signal-service";

export interface CorrelationInput {
  signal: ContinuitySignal;
  now?: Date;
}

export interface CorrelationResult {
  action:
    | "open_or_extend_case"
    | "attach_to_open_case"
    | "hold_for_review"
    | "reject_stale"
    | "reject_unvalidated"
    | "no_participant_no_case";
  reason: string;
  caseCategory: "care" | "transport" | "appointment_non_clinical" | "employment" | "housing" | "provider_failure" | "finance_recovery" | "civic_disruption" | "life_event" | "other";
}

const KIND_TO_CATEGORY: Record<ContinuitySignalKind, CorrelationResult["caseCategory"]> = {
  care_shift_cancelled: "care",
  transport_booking_cancelled: "transport",
  worker_unavailable: "care",
  provider_closure_notice: "provider_failure",
  no_show_pattern: "care",
  address_mismatch: "other",
  funding_expiring: "finance_recovery",
  plan_reassessment_due: "other",
  life_event_declared: "life_event",
  aura_flag: "other",
  external_civic_feed: "civic_disruption",
  reliability_incident: "provider_failure",
  provider_failure: "provider_failure",
  reservation_expired: "other",
  other: "other",
};

export function correlateSignal(input: CorrelationInput): CorrelationResult {
  const now = input.now ?? new Date();
  const usable = isSignalDestructivelyUsable(input.signal, now);
  const category = KIND_TO_CATEGORY[input.signal.kind];

  if (input.signal.status === "stale") {
    return { action: "reject_stale", reason: "stale", caseCategory: category };
  }

  if (!input.signal.participantId) {
    return { action: "no_participant_no_case", reason: "no_participant_scope", caseCategory: category };
  }

  // Destructive-usable signals (validated, medium+ confidence) open/extend
  // a case immediately. Otherwise the signal is held for coordinator review.
  if (usable.usable) {
    return { action: "open_or_extend_case", reason: "validated_and_fresh", caseCategory: category };
  }
  return { action: "hold_for_review", reason: usable.reason ?? "not_yet_usable", caseCategory: category };
}
