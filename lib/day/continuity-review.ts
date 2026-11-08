import type {
  Certainty,
  ContextualActivity,
  MyDaySnapshot,
} from "@/lib/dashboard/my-day-status";

/**
 * Read-only participant continuity presentation.
 *
 * This is NOT a second booking, identity, consent, AAC, or DayEval engine.
 * The canonical LifeVal/DayEval dependency engine is being developed in
 * ausdisau/MapAble PR #32. An accepted record is never evidence of
 * worker clearance, accessible-vehicle fit, or AAC acknowledgement.
 */
export type DayReviewIssue = Pick<
  ContextualActivity,
  "id" | "kind" | "title" | "href" | "certaintyNote"
> & {
  sourceStatus: Extract<Certainty, "pending" | "cancelled" | "unknown">;
  priority: "needs-action" | "needs-review";
};

export type DayEvidenceCheck = {
  code: "worker-eligibility" | "vehicle-fit" | "aac-readiness" | "dependency-fit";
  label: string;
  finding: "not_assessed";
  explanation: string;
};

const UNCHECKED_EVIDENCE: readonly DayEvidenceCheck[] = [
  {
    code: "worker-eligibility",
    label: "Worker suitability",
    finding: "not_assessed",
    explanation: "A care booking status does not verify a worker's identity, screening, competence or availability.",
  },
  {
    code: "vehicle-fit",
    label: "Accessible vehicle fit",
    finding: "not_assessed",
    explanation: "A transport booking status does not establish lift, boarding, wheelchair or securement suitability.",
  },
  {
    code: "aac-readiness",
    label: "Communication readiness",
    finding: "not_assessed",
    explanation: "This view has no evidence that a worker received or reviewed participant-authored AAC instructions.",
  },
  {
    code: "dependency-fit",
    label: "Cross-service dependencies",
    finding: "not_assessed",
    explanation: "Care, transport, appointment and return-trip dependencies have not been reconciled by this view.",
  },
];

export type DayContinuityReview = {
  source: "programmatic";
  generatedAt: string;
  readiness: "not_assessed";
  issues: DayReviewIssue[];
  evidenceChecks: readonly DayEvidenceCheck[];
  suggestedHumanReview: boolean;
  changesExternalRecords: false;
  autoAssignsWorkerOrVehicle: false;
};

export function buildDayContinuityReview(
  snapshot: MyDaySnapshot,
): DayContinuityReview {
  const reviewable = [
    ...(snapshot.continuityAlerts ?? []),
    ...snapshot.pendingActions,
  ].filter(
    (activity): activity is ContextualActivity & {
      status: "pending" | "cancelled" | "unknown";
    } => activity.status !== "confirmed",
  );

  // Existing self-scoped activity IDs are sufficient to deduplicate the view.
  // Do not accept a client participant ID or silently join external records.
  const byId = new Map(reviewable.map((activity) => [activity.id, activity]));
  const issues: DayReviewIssue[] = Array.from(byId.values())
    .map((activity) => ({
      id: activity.id,
      kind: activity.kind,
      title: activity.title,
      href: activity.href,
      certaintyNote: activity.certaintyNote,
      sourceStatus: activity.status,
      priority: activity.status === "cancelled" ? "needs-action" : "needs-review",
    }))
    .sort((a, b) =>
      Number(b.priority === "needs-action") - Number(a.priority === "needs-action"),
    );

  return {
    source: snapshot.source,
    generatedAt: snapshot.generatedAt,
    // A booking record alone can NEVER establish whole-day readiness.
    readiness: "not_assessed",
    issues,
    evidenceChecks: UNCHECKED_EVIDENCE,
    suggestedHumanReview: issues.some((item) => item.sourceStatus === "cancelled"),
    changesExternalRecords: false,
    autoAssignsWorkerOrVehicle: false,
  };
}
