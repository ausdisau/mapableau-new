export interface EquityCohort {
  /** Aggregate categories, not individuals, diagnoses, or inferred characteristics. */
  cohortId: string;
  eligibleServiceRequests: number;
  fulfilledServiceRequests: number;
}
export interface EquityFinding {
  cohortId: string;
  visibility: 'visible' | 'suppressed';
  fulfilmentRate: number | null;
  differenceFromVisiblePooledRate: number | null;
  requiresHumanInvestigation: boolean;
}

/** Detect differences in service fulfilment. Does not score human worth or causal discrimination. */
export function auditServiceEquity(input: {
  cohorts: readonly EquityCohort[];
  minimumCohortSize?: number;
  reviewThresholdPercentagePoints?: number;
}): { visiblePooledRate: number | null; findings: EquityFinding[]; warning: string } {
  const min = input.minimumCohortSize ?? 10;
  const threshold = input.reviewThresholdPercentagePoints ?? 0.15;
  if (!Number.isSafeInteger(min) || min < 2 || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new Error('Invalid suppression or review threshold');
  }
  const ids = new Set<string>();
  for (const cohort of input.cohorts) {
    if (!cohort.cohortId || ids.has(cohort.cohortId) || !Number.isSafeInteger(cohort.eligibleServiceRequests) ||
        !Number.isSafeInteger(cohort.fulfilledServiceRequests) || cohort.fulfilledServiceRequests < 0 ||
        cohort.eligibleServiceRequests < 0 || cohort.fulfilledServiceRequests > cohort.eligibleServiceRequests) {
      throw new Error('Cohorts require unique IDs and valid aggregated counts');
    }
    ids.add(cohort.cohortId);
  }
  const visible = input.cohorts.filter((c) => c.eligibleServiceRequests >= min);
  const total = visible.reduce((sum,c) => sum+c.eligibleServiceRequests,0);
  const fulfilled = visible.reduce((sum,c) => sum+c.fulfilledServiceRequests,0);
  const pooled = total > 0 ? fulfilled / total : null;
  const findings = [...input.cohorts].sort((a,b)=>a.cohortId.localeCompare(b.cohortId)).map((c) => {
    if (c.eligibleServiceRequests < min || pooled === null) {
      return { cohortId: c.cohortId, visibility: 'suppressed' as const, fulfilmentRate: null,
        differenceFromVisiblePooledRate: null, requiresHumanInvestigation: false };
    }
    const rate = c.fulfilledServiceRequests/c.eligibleServiceRequests;
    const diff = rate-pooled;
    return { cohortId: c.cohortId, visibility: 'visible' as const, fulfilmentRate: rate,
      differenceFromVisiblePooledRate: diff,
      requiresHumanInvestigation: Math.abs(diff) + 1e-12 >= threshold };
  });
  return { visiblePooledRate: pooled, findings,
    warning: 'This is a descriptive disparity screen, not a finding of discrimination. Suppression thresholds alone do not ensure privacy.' };
}
