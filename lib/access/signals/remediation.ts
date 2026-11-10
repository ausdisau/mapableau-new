/**
 * Synthetic remediation lifecycle — closed work ≠ automatic Green.
 */

export const REMEDIATION_STATUSES = [
  "reported",
  "triaged",
  "planned",
  "in_progress",
  "reassessment_required",
  "closed",
  "disputed",
  "deferred",
  "cancelled",
] as const;

export type RemediationStatus = (typeof REMEDIATION_STATUSES)[number];

export type SyntheticRemediationItem = {
  id: string;
  title: string;
  zoneId: string;
  featureId: string;
  status: RemediationStatus;
  /** Closing remediation never auto-promotes RAG to Green. */
  requiresFollowUpAssessment: boolean;
  notes: string;
};

export function makeSyntheticRemediationQueue(): SyntheticRemediationItem[] {
  return [
    {
      id: "rem-1",
      title: "Install kerb ramp at harbour crossing",
      zoneId: "zone-harbour",
      featureId: "feat-kerb-missing",
      status: "planned",
      requiresFollowUpAssessment: true,
      notes: "Synthetic placemaking item — no live council ticket.",
    },
    {
      id: "rem-2",
      title: "Lift maintenance follow-up",
      zoneId: "zone-station",
      featureId: "feat-lift-outage",
      status: "in_progress",
      requiresFollowUpAssessment: true,
      notes: "Temporary outage; reassessment required after return to service.",
    },
    {
      id: "rem-3",
      title: "Closed works — awaiting reassessment",
      zoneId: "zone-side",
      featureId: "feat-ramp-community",
      status: "closed",
      requiresFollowUpAssessment: true,
      notes: "Closed ≠ Green. Follow-up assessment fixture required.",
    },
  ];
}

export function remediationImpliesGreen(item: SyntheticRemediationItem): false {
  void item;
  return false;
}
