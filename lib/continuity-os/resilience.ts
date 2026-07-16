import type { DependencyProjection } from "@/lib/continuity-os/dependency-projection";
import type { ContinuityPreferenceSet } from "@/lib/continuity-os/types";
import { buildMilestoneViews } from "@/lib/continuity-os/milestone-engine";

export interface ResilienceFinding {
  code: string;
  severity: "information" | "attention" | "major";
  title: string;
  explanation: string;
  affectedDependencyIds: string[];
  participantActions: string[];
  nonAiContacts: string[];
  humanReviewRequired: boolean;
}

export interface ResilienceAssessmentResult {
  findings: ResilienceFinding[];
  singlePointsOfFailure: string[];
  unconfirmedDependencies: string[];
  staleEvidence: string[];
  timingConflicts: string[];
  missingAlternatives: string[];
  recoveryOptionHints: string[];
  /** Explicitly never a participant risk/worthiness score. */
  participantScore: null;
  preferencesHonoured: string[];
}

/**
 * Deterministic pre-mortem. Does not predict participant behaviour.
 * Does not assign a hidden risk score.
 */
export function assessResilience(params: {
  typeKey: string;
  typeVersion: string;
  projection: DependencyProjection;
  preferences?: ContinuityPreferenceSet;
}): ResilienceAssessmentResult {
  const { projection, preferences } = params;
  const findings: ResilienceFinding[] = [];

  const unconfirmed = projection.nodes
    .filter((n) => n.state === "unconfirmed" || n.state === "unknown")
    .map((n) => n.id);

  const stale = projection.nodes
    .filter((n) => n.state === "stale")
    .map((n) => n.id);

  for (const id of projection.singlePointsOfFailure) {
    const node = projection.nodes.find((n) => n.id === id);
    findings.push({
      code: "SINGLE_POINT_OF_FAILURE",
      severity: "major",
      title: `${node?.label ?? id} has no verified alternative`,
      explanation:
        "This dependency is a single point of failure for the mission. ContinuityOS lists contingency options; it does not book or assign replacements.",
      affectedDependencyIds: [id],
      participantActions: [
        "Review contingency options",
        "Confirm whether a human coordinator should help",
      ],
      nonAiContacts: [node?.responsibility.recoveryResponsibility ?? "Human coordinator"],
      humanReviewRequired: false,
    });
  }

  for (const id of unconfirmed) {
    const node = projection.nodes.find((n) => n.id === id);
    if (!node?.required) continue;
    findings.push({
      code: "UNCONFIRMED_REQUIRED_DEPENDENCY",
      severity: "attention",
      title: `${node.label} is not confirmed`,
      explanation:
        node.unknownReason ??
        "Required dependency remains unconfirmed. Missing information stays unknown.",
      affectedDependencyIds: [id],
      participantActions: ["Confirm or mark as still unknown"],
      nonAiContacts: [node.owner],
      humanReviewRequired: false,
    });
  }

  for (const id of stale) {
    findings.push({
      code: "STALE_EVIDENCE",
      severity: "attention",
      title: `Evidence for ${id} is stale`,
      explanation: "Stale information remains stale until refreshed from the canonical service.",
      affectedDependencyIds: [id],
      participantActions: ["Request a refresh from the responsible service"],
      nonAiContacts: ["Service owner"],
      humanReviewRequired: false,
    });
  }

  const milestones = buildMilestoneViews({
    typeKey: params.typeKey,
    typeVersion: params.typeVersion,
    projection,
  });
  const timingConflicts: string[] = [];
  const arrival = milestones.find((m) => m.key === "service_commenced");
  if (
    arrival &&
    arrival.missingDependencies.includes("accessible_transport") &&
    arrival.missingDependencies.includes("morning_support_worker")
  ) {
    timingConflicts.push(
      "Support worker and transport are both unconfirmed against the arrival deadline"
    );
    findings.push({
      code: "TIMING_CONFLICT",
      severity: "major",
      title: "Arrival deadline depends on unconfirmed support and transport",
      explanation:
        "If transport is late or the worker cancels, the first-day arrival goal is at risk. Options will be compared later; nothing is executed automatically.",
      affectedDependencyIds: [
        "accessible_transport",
        "morning_support_worker",
        "arrival_before_845",
      ],
      participantActions: [
        "Review contingency preferences",
        "Ask a human coordinator if you want help",
      ],
      nonAiContacts: ["Transport coordinator", "Provider manager"],
      humanReviewRequired: false,
    });
  }

  const missingAlternatives = projection.singlePointsOfFailure.filter((id) => {
    const node = projection.nodes.find((n) => n.id === id);
    return !node || node.alternativeIds.length === 0;
  });

  const preferencesHonoured: string[] = [];
  if (preferences?.avoidUnfamiliarWorkers) {
    preferencesHonoured.push("avoidUnfamiliarWorkers");
  }
  if (preferences?.preserveOriginalAppointment) {
    preferencesHonoured.push("preserveOriginalAppointment");
  }
  if (preferences?.preferHumanCoordinator) {
    preferencesHonoured.push("preferHumanCoordinator");
  }
  if (preferences?.minimiseAdditionalDisclosure) {
    preferencesHonoured.push("minimiseAdditionalDisclosure");
  }

  return {
    findings,
    singlePointsOfFailure: projection.singlePointsOfFailure,
    unconfirmedDependencies: unconfirmed,
    staleEvidence: stale,
    timingConflicts,
    missingAlternatives,
    recoveryOptionHints: projection.singlePointsOfFailure.map(
      (id) => `Prepare contingency for ${id}`
    ),
    participantScore: null,
    preferencesHonoured,
  };
}
