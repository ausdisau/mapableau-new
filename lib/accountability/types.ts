export type PublicationWorkflowStage =
  | "prepare"
  | "privacy_review"
  | "safeguarding_review"
  | "approve"
  | "publish";

export type PublicMetricCard = {
  publicCode: string;
  name: string;
  domain: string;
  unit: string;
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  target: number | null;
  previousValue: number | null;
  sampleSize: number | null;
  completenessPercentage: number | null;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  methodologyPublicCode: string;
  accessibleSummary: string;
  trendDescription: string;
  statusAgainstTarget: "met" | "missed" | "on_track" | "unknown" | "suppressed";
  suppressionReason: string | null;
  isDemonstration: boolean;
};

export type AccountabilityPortalStatus = {
  reportingPeriodLabel: string;
  latestPublicationDate: string | null;
  dataCompletenessPct: number | null;
  hasMajorCorrection: boolean;
  hasUnresolvedCriticalCommitment: boolean;
  snapshotPublicId: string | null;
  contentSha256: string | null;
  isDemonstration: boolean;
};
