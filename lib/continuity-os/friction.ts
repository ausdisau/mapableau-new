/**
 * Access Friction Ledger — measures system burden, never participants.
 */

export type FrictionCause =
  | "repeated_disclosure"
  | "inaccessible_document"
  | "failed_login"
  | "failed_identity_check"
  | "unaccepted_handoff"
  | "extra_travel"
  | "extra_form"
  | "extra_call"
  | "service_cancellation"
  | "retry"
  | "waiting_time"
  | "staff_dependence"
  | "participant_coordination_time";

export interface AccessFrictionEventInput {
  sourceService: string;
  organisationId?: string;
  workflow: string;
  cause: FrictionCause;
  participantActionRequired: string;
  timeBurdenMinutes?: number;
  travelBurdenKm?: number;
  disclosureBurdenFields?: number;
  financialBurdenCents?: number;
  accessibilityBurden?: string;
  avoidable: boolean;
  evidence?: string;
  remediationOwner: string;
  missionId?: string;
  recoveryCaseId?: string;
}

export interface AccessFrictionSummary {
  eventCount: number;
  totalTimeBurdenMinutes: number;
  totalTravelBurdenKm: number;
  totalDisclosureFields: number;
  avoidableCount: number;
  byCause: Record<string, number>;
  /** Explicitly not a participant score. */
  participantScore: null;
  systemBurdenLabel: "low" | "moderate" | "high";
}

export function summariseFriction(
  events: AccessFrictionEventInput[]
): AccessFrictionSummary {
  const byCause: Record<string, number> = {};
  let totalTime = 0;
  let totalTravel = 0;
  let totalDisclosure = 0;
  let avoidableCount = 0;

  for (const e of events) {
    byCause[e.cause] = (byCause[e.cause] ?? 0) + 1;
    totalTime += e.timeBurdenMinutes ?? 0;
    totalTravel += e.travelBurdenKm ?? 0;
    totalDisclosure += e.disclosureBurdenFields ?? 0;
    if (e.avoidable) avoidableCount += 1;
  }

  let systemBurdenLabel: AccessFrictionSummary["systemBurdenLabel"] = "low";
  if (totalTime >= 120 || events.length >= 8) systemBurdenLabel = "high";
  else if (totalTime >= 30 || events.length >= 3) systemBurdenLabel = "moderate";

  return {
    eventCount: events.length,
    totalTimeBurdenMinutes: totalTime,
    totalTravelBurdenKm: totalTravel,
    totalDisclosureFields: totalDisclosure,
    avoidableCount,
    byCause,
    participantScore: null,
    systemBurdenLabel,
  };
}
