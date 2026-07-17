import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type OperationsAttentionItem,
  type OperationsProjection,
} from "@/lib/connected-capability";
import { computeWorkerReadiness } from "@/lib/workforce-os";
import { taylorSupportWorker } from "@/lib/workforce-os/taylor-worker";

/**
 * Read-only Daily Attention Queue projection.
 * Does not become an operational source of truth.
 */
export function buildSyntheticAttentionQueue(
  organisationId = "fixture-harbour-provider"
): OperationsProjection {
  const readiness = computeWorkerReadiness(taylorSupportWorker, {
    workerProfileId: taylorSupportWorker.workerProfileId,
    organisationId,
    purpose: "ops_attention",
    requiredCompetencies: taylorSupportWorker.requiredCompetencies,
    participantIntroductionRequired: true,
  });

  const items: OperationsAttentionItem[] = [];

  if (readiness.assignmentReadiness === "blocked") {
    items.push({
      id: "attn-competency-unresolved",
      organisationId,
      kind: "competency_unresolved",
      title: "Worker competency evidence unresolved",
      why: readiness.blockers.join(" "),
      owner: "provider_workforce_lead",
      ifUnresolved:
        "Assignment readiness remains blocked; do not auto-assign.",
      relatedEntityType: "WorkerProfile",
      relatedEntityId: taylorSupportWorker.workerProfileId,
      participantFieldsExposed: [],
      freshness: "synthetic",
      createdAt: new Date().toISOString(),
    });
  }

  items.push({
    id: "attn-transport-at-risk",
    organisationId,
    kind: "transport_at_risk",
    title: "Return transport at risk (simulated cancellation)",
    why: "Outbound completed; return leg may cancel.",
    owner: "transport_dispatcher",
    ifUnresolved:
      "Participant may be stranded; regional capacity candidates may be sought with approval.",
    relatedEntityType: "TransportTrip",
    relatedEntityId: "fixture-return-trip",
    participantFieldsExposed: ["first_name_only"],
    freshness: "synthetic",
    createdAt: new Date().toISOString(),
  });

  items.push({
    id: "attn-outcome-review",
    organisationId,
    kind: "outcome_review_due",
    title: "Participant outcome review due",
    why: "First-day induction outcome awaiting participant confirmation.",
    owner: "service_coordinator",
    ifUnresolved: "Outcome remains unknown — do not mark success.",
    relatedEntityType: "OutcomeContract",
    relatedEntityId: "fixture-taylor-outcome-contract",
    participantFieldsExposed: ["goal_statement"],
    freshness: "synthetic",
    createdAt: new Date().toISOString(),
  });

  items.push({
    id: "attn-communication-unacked",
    organisationId,
    kind: "communication_requirement_unacknowledged",
    title: "Communication requirements unacknowledged",
    why: "Worker has not acknowledged AAC and one-question instructions.",
    owner: "assigned_worker",
    ifUnresolved: "Service interaction must not begin without acknowledgement.",
    relatedEntityType: "CommunicationPassportProjection",
    relatedEntityId: "comm-passport-fixture-taylor-accessibility-profile",
    participantFieldsExposed: ["communication_requirements_summary"],
    freshness: "synthetic",
    createdAt: new Date().toISOString(),
  });

  return {
    organisationId,
    generatedAt: new Date().toISOString(),
    items,
    isReadOnly: true,
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
  };
}
