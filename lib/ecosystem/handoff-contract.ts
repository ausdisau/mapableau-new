/**
 * Proposed MapAble One cross-service handoff contract, version 1.
 *
 * This module deliberately contains no network calls, mutations, storage or
 * model-execution authority. Source modules retain ownership of records.
 * Future handoffs require an authenticated session, explicit purpose-specific
 * permission and an independently logged human confirmation.
 */
import type { EcosystemServiceId } from "@/lib/ecosystem/service-directory";

export const MAPABLE_HANDOFF_CONTRACT_VERSION = "1" as const;

export type ServiceHandoffIntent =
  | "explore"
  | "compare"
  | "prepare-request"
  | "request-human-help";

export type ProvenanceLevel =
  | "official"
  | "observed-unverified"
  | "provider-declared"
  | "synthetic"
  | "unknown";

export type MapAbleHandoffDraft = {
  contractVersion: typeof MAPABLE_HANDOFF_CONTRACT_VERSION;
  sourceService: EcosystemServiceId;
  destinationService: EcosystemServiceId;
  intent: ServiceHandoffIntent;
  sourceRecord?: {
    sourceType: string;
    recordId: string;
    provenance: ProvenanceLevel;
  };
  participantConfirmationRequired: true;
  sharedParticipantData: false;
  externalActionPermitted: false;
  bookingPermitted: false;
  paymentPermitted: false;
  auditEventNeededBeforeActivation: true;
  notice: string;
};

export type HandoffResult =
  | { acceptedForPreview: true; draft: MapAbleHandoffDraft }
  | { acceptedForPreview: false; reason: string };

const ALLOWED_PREVIEW_INTENTS: ReadonlySet<ServiceHandoffIntent> = new Set([
  "explore",
  "compare",
  "prepare-request",
  "request-human-help",
]);

const PROVENANCE_LEVELS: ReadonlySet<ProvenanceLevel> = new Set([
  "official",
  "observed-unverified",
  "provider-declared",
  "synthetic",
  "unknown",
]);

export function createReadOnlyHandoffDraft(input: {
  sourceService: EcosystemServiceId;
  destinationService: EcosystemServiceId;
  intent: ServiceHandoffIntent;
  sourceRecord?: MapAbleHandoffDraft["sourceRecord"];
}): HandoffResult {
  if (input.sourceService === input.destinationService) {
    return { acceptedForPreview: false, reason: "Choose another service." };
  }
  if (!ALLOWED_PREVIEW_INTENTS.has(input.intent)) {
    return { acceptedForPreview: false, reason: "Unsupported handoff intent." };
  }
  if (input.sourceRecord) {
    const { sourceType, recordId, provenance } = input.sourceRecord;
    if (
      !sourceType ||
      sourceType.length > 80 ||
      !/^[a-zA-Z0-9_-]+$/.test(sourceType) ||
      !recordId ||
      recordId.length > 128 ||
      !/^[a-zA-Z0-9:_-]+$/.test(recordId) ||
      !PROVENANCE_LEVELS.has(provenance)
    ) {
      return {
        acceptedForPreview: false,
        reason: "Source record metadata is incomplete or invalid.",
      };
    }
  }
  return {
    acceptedForPreview: true,
    draft: {
      contractVersion: MAPABLE_HANDOFF_CONTRACT_VERSION,
      sourceService: input.sourceService,
      destinationService: input.destinationService,
      intent: input.intent,
      ...(input.sourceRecord ? { sourceRecord: input.sourceRecord } : {}),
      participantConfirmationRequired: true,
      sharedParticipantData: false,
      externalActionPermitted: false,
      bookingPermitted: false,
      paymentPermitted: false,
      auditEventNeededBeforeActivation: true,
      notice:
        "Information-only draft. Nothing is shared, purchased, published, changed or booked.",
    },
  };
}
