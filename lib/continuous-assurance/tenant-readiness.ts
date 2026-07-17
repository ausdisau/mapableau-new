import { evaluateContinuousAssurance } from "./evaluator";

export interface TenantReadiness {
  organisationId: string;
  ready: boolean;
  score: number;
  blockers: string[];
}

export async function evaluateTenantReadiness(
  organisationId: string
): Promise<TenantReadiness> {
  const snapshot = await evaluateContinuousAssurance(organisationId);
  const blockers: string[] = [];
  if (snapshot.totalControls === 0) blockers.push("no_controls_seeded");
  if (snapshot.failingControls > 0) blockers.push("failing_controls");
  if (snapshot.overdueTests > 0) blockers.push("overdue_control_assessments");
  if (snapshot.outstandingExceptions > 0) {
    blockers.push("outstanding_exceptions");
  }

  const total = Math.max(snapshot.totalControls, 1);
  const score = Math.round((snapshot.passingControls / total) * 100);
  const ready = blockers.length === 0 && score >= 80;
  return { organisationId, ready, score, blockers };
}
