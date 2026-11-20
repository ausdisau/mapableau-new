import {
  FICTIONAL_WORKERS,
  reviewFictionalWorker,
  type CandidatePreview,
  type ParticipantCriteria,
} from "@/lib/matching/participant-preview";
import {
  PREFERRED_WORKER_ID,
  RESTRICTED_WORKER_ID,
  SUBSTITUTE_WORKER_ID,
} from "@/lib/my-day-resilience/fixtures";
import type {
  CommunicationNeed,
  Proposal,
  SourceEvidence,
} from "@/lib/my-day-resilience/types";

/**
 * P05 synthetic care continuity adapter.
 * Reuses reviewFictionalWorker — does not call the production matching engine.
 */

export function buildCareCriteria(input: {
  communicationNeeds: CommunicationNeed[];
  preferredWorkerId: string;
  excludedWorkerIds?: string[];
}): ParticipantCriteria {
  return {
    communicationNeeds: input.communicationNeeds,
    requiredCompetencies: ["aac_support", "personal_care"],
    preferredWindow: "weekday_morning",
    familiarWorkerIds: [input.preferredWorkerId],
    excludedWorkerIds: input.excludedWorkerIds ?? [],
  };
}

export function reviewCareWorkers(
  criteria: ParticipantCriteria,
): CandidatePreview[] {
  return FICTIONAL_WORKERS.map((worker) =>
    reviewFictionalWorker(criteria, worker),
  );
}

export function preferredWorkerPreview(
  criteria: ParticipantCriteria,
): CandidatePreview | undefined {
  return reviewCareWorkers(criteria).find(
    (c) => c.workerId === PREFERRED_WORKER_ID,
  );
}

export function mapCandidateEvidence(
  candidate: CandidatePreview,
): SourceEvidence[] {
  return candidate.factors.map((factor, index) => ({
    id: `care_${candidate.workerId}_${index}`,
    topic: factor.topic,
    honesty: mapFactorHonesty(factor.state),
    summary: `${candidate.label}: ${factor.explanation}`,
    capabilityClaim: "in_development" as const,
  }));
}

function mapFactorHonesty(
  state: CandidatePreview["factors"][number]["state"],
): SourceEvidence["honesty"] {
  switch (state) {
    case "fictional_only":
      return "fictional";
    case "unknown":
    case "not_requested":
      return "unknown";
    case "needs_confirmation":
      return "declared";
    case "blocked":
      return "unknown";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export type CareDisruptionKind =
  | "preferred_worker_cancelled"
  | "worker_unavailable"
  | "no_verified_option";

export function buildCareRecoveryProposals(input: {
  criteria: ParticipantCriteria;
  disruption: CareDisruptionKind;
  declinedProposalIds: string[];
}): Proposal[] {
  const reviews = reviewCareWorkers(input.criteria);
  const substitute = reviews.find((r) => r.workerId === SUBSTITUTE_WORKER_ID);
  const restricted = reviews.find((r) => r.workerId === RESTRICTED_WORKER_ID);
  const proposals: Proposal[] = [];

  const aacMissing =
    substitute?.factors.find((f) => f.topic === "Communication access")
      ?.state === "unknown" ||
    input.criteria.communicationNeeds.some(
      (need) =>
        !FICTIONAL_WORKERS.find((w) => w.id === SUBSTITUTE_WORKER_ID)
          ?.communicationSupports.includes(need),
    );

  if (substitute && substitute.discussionOnly && !aacMissing) {
    const id = "proposal_substitute_worker";
    if (!input.declinedProposalIds.includes(id)) {
      proposals.push({
        id,
        kind: "substitute_worker",
        label: `Discuss fictional substitute ${substitute.label}`,
        explanation:
          "Fictional substitute listed for discussion only. Screening, competence and availability are not verified. canBook remains false.",
        evidence: mapCandidateEvidence(substitute),
        verifiedInScenario: false,
        canExecute: false,
        requiresParticipantApproval: true,
        humanReviewRequired: true,
      });
    }
  }

  if (substitute && aacMissing) {
    const id = "proposal_unsuitable_substitute";
    if (!input.declinedProposalIds.includes(id)) {
      proposals.push({
        id,
        kind: "substitute_worker",
        label: `Unsuitable fictional substitute ${substitute.label} (AAC gap)`,
        explanation:
          "The fictional substitute does not document every selected communication requirement. AAC preference must be preserved; this option is not a verified alternative.",
        evidence: mapCandidateEvidence(substitute),
        verifiedInScenario: false,
        canExecute: false,
        requiresParticipantApproval: true,
        humanReviewRequired: true,
      });
    }
  }

  if (restricted && !restricted.discussionOnly) {
    // Restricted workers never become proposals.
  }

  proposals.push({
    id: "proposal_human_care_escalation",
    kind: "human_coordination",
    label: "Ask a human coordinator to review care alternatives",
    explanation:
      "No independently verified worker alternative exists in this synthetic scenario. Human review is required before any real-world arrangement change.",
    evidence: [
      {
        id: "ev_no_verified_worker",
        topic: "Verified worker alternative",
        honesty: "unknown",
        summary:
          "Scenario has no verified screening, competence or availability for a replacement worker.",
        capabilityClaim: "in_development",
      },
    ],
    verifiedInScenario: false,
    canExecute: false,
    requiresParticipantApproval: true,
    humanReviewRequired: true,
  });

  proposals.push({
    id: "proposal_defer_care",
    kind: "defer_activity",
    label: "Defer the supported activity until a suitable worker is confirmed",
    explanation:
      "Participant may defer. No booking, assignment or payment is created.",
    evidence: [],
    verifiedInScenario: false,
    canExecute: false,
    requiresParticipantApproval: true,
    humanReviewRequired: true,
  });

  return proposals.filter((p) => !input.declinedProposalIds.includes(p.id));
}

export function assertNeverBookable(candidate: CandidatePreview): void {
  if (
    candidate.canBook !== false ||
    candidate.verifiedScreening !== false ||
    candidate.verifiedCompetence !== false ||
    candidate.confirmedAvailability !== false
  ) {
    throw new Error("Care adapter invariant violated: booking-like flags set");
  }
}
