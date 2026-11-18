import type {
  ConsentGrant,
  ConsentPurpose,
  DecisionAuditEvent,
  ServiceOffer,
} from "@mapable/service-cartography";

export const CARTOGRAPHY_FAILURE_MODES = [
  "consent_withdrawn",
  "stale_evidence",
  "unverified_provider",
  "communication_mismatch",
  "missing_transport_link",
  "no_match",
  "cancellation_without_fallback",
  "unknown_supply",
] as const;

export type CartographyFailureMode = (typeof CARTOGRAPHY_FAILURE_MODES)[number];

export type CartographyCallerSource = "session" | "synthetic_simulate";

/** Server-derived caller identity. Never accept client-submitted tenant IDs. */
export type CartographyCallerContext = {
  actorUserId: string | null;
  organisationId: string | null;
  source: CartographyCallerSource;
};

export interface CartographyAdapter {
  loadVerifiedOffersForGoal(
    goalRef: string,
    callerContext: CartographyCallerContext,
  ): Promise<ServiceOffer[]>;
  loadPurposeBoundGrant(
    subjectRef: string,
    purpose: ConsentPurpose,
    callerContext: CartographyCallerContext,
  ): Promise<ConsentGrant[]>;
  recordAdvisoryOutcome(
    event: DecisionAuditEvent,
    callerContext: CartographyCallerContext,
  ): Promise<void>;
}

export const SERVICE_CARTOGRAPHY_PROHIBITIONS = [
  "no_booking",
  "no_payment",
  "no_ndis_claim",
  "no_auto_assignment",
  "no_live_participant_data",
  "no_public_accessible_route_claim",
] as const;
