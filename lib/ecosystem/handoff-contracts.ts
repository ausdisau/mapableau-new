/**
 * Read-only cross-service handoff contracts for MapAble One.
 *
 * These types describe participant-confirmed discovery suggestions only.
 * They do not book, publish, pay, assign workers or mutate Core records.
 */

import type { EcosystemServiceId } from "@/lib/ecosystem/service-directory";

export type HandoffEvidenceStatus =
  | "observed"
  | "unverified-report"
  | "moderated-report"
  | "official"
  | "inference"
  | "synthetic";

export type HandoffRequestedAction =
  | "review-evidence"
  | "explore-alternative-route"
  | "open-transport-information"
  | "consider-day-impact"
  | "find-community-discussion"
  | "explore-care-information"
  | "explore-marketplace-information"
  | "explore-provider-information";

export type ServiceHandoffRequest = {
  readonly serviceId: EcosystemServiceId;
  readonly sourceRecordId: string;
  /** Who may authorise the next real-world step — never inferred silently. */
  readonly participantAuthority: "participant" | "delegate-with-consent" | "none";
  readonly requiredPermission: string;
  readonly requestedAction: HandoffRequestedAction;
  readonly evidenceStatus: HandoffEvidenceStatus;
  /** Always true for this tranche — no silent execution. */
  readonly confirmationRequired: true;
  readonly failureRecovery: string;
  readonly auditEventReference: string | null;
  readonly summary: string;
};

export type ChallengeDiscoveryContext = {
  readonly challengeId: string;
  readonly barrierSummary: string;
  readonly evidenceStatus: HandoffEvidenceStatus;
};

/**
 * Suggest next discovery steps after an accessibility challenge observation.
 * Pure function — no I/O, no booking, no publication.
 */
export function suggestChallengeDiscoveryHandoffs(
  context: ChallengeDiscoveryContext,
): readonly ServiceHandoffRequest[] {
  const baseId = context.challengeId.trim() || "challenge-unknown";
  const evidence = context.evidenceStatus;

  return [
    {
      serviceId: "access",
      sourceRecordId: baseId,
      participantAuthority: "participant",
      requiredPermission: "access:read-public",
      requestedAction: "review-evidence",
      evidenceStatus: evidence,
      confirmationRequired: true,
      failureRecovery:
        "If evidence is missing, keep the barrier labelled unverified and do not publish.",
      auditEventReference: null,
      summary: `Review source evidence for: ${context.barrierSummary}`,
    },
    {
      serviceId: "access",
      sourceRecordId: baseId,
      participantAuthority: "participant",
      requiredPermission: "access:read-public",
      requestedAction: "explore-alternative-route",
      evidenceStatus: evidence,
      confirmationRequired: true,
      failureRecovery:
        "If no alternative is known, show that uncertainty rather than inventing a route.",
      auditEventReference: null,
      summary: "Explore another accessible route or entrance if available.",
    },
    {
      serviceId: "transport",
      sourceRecordId: baseId,
      participantAuthority: "participant",
      requiredPermission: "transport:read-public",
      requestedAction: "open-transport-information",
      evidenceStatus: "inference",
      confirmationRequired: true,
      failureRecovery:
        "Transport information links do not create a trip booking.",
      auditEventReference: null,
      summary: "Open Transport information to consider travel options.",
    },
    {
      serviceId: "day",
      sourceRecordId: baseId,
      participantAuthority: "participant",
      requiredPermission: "day:preview",
      requestedAction: "consider-day-impact",
      evidenceStatus: "inference",
      confirmationRequired: true,
      failureRecovery:
        "MapAble Day is planned in this repository — show preview state only.",
      auditEventReference: null,
      summary: "Consider the impact on a planned activity (preview only).",
    },
    {
      serviceId: "cripsquare",
      sourceRecordId: baseId,
      participantAuthority: "none",
      requiredPermission: "community:none",
      requestedAction: "find-community-discussion",
      evidenceStatus: "inference",
      confirmationRequired: true,
      failureRecovery:
        "CripSquare is not federated — do not import posts or private messages.",
      auditEventReference: null,
      summary: "Find relevant community discussion when a boundary contract exists.",
    },
    {
      serviceId: "care",
      sourceRecordId: baseId,
      participantAuthority: "participant",
      requiredPermission: "care:read-public",
      requestedAction: "explore-care-information",
      evidenceStatus: "inference",
      confirmationRequired: true,
      failureRecovery: "Care links are informational — no worker is assigned.",
      auditEventReference: null,
      summary: "Explore Care information if support would help with the journey.",
    },
  ] as const;
}

export function handoffRequiresConfirmation(
  handoff: ServiceHandoffRequest,
): true {
  return handoff.confirmationRequired;
}
