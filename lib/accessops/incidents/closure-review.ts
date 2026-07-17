export interface ClosureReviewDecision {
  canClose: boolean;
  reason: string;
}

export function reviewIncidentClosure(input: {
  restorationEvidenceRef?: string | null;
  unresolvedCommunityReports?: number;
}): ClosureReviewDecision {
  if (!input.restorationEvidenceRef)
    return { canClose: false, reason: "missing_restoration_evidence" };
  if ((input.unresolvedCommunityReports ?? 0) > 0)
    return { canClose: false, reason: "unresolved_reports" };
  return { canClose: true, reason: "evidence_present" };
}
