export type FreshnessEvaluation = {
  fresh: boolean;
  ageDays: number;
  freshnessDays: number;
  reason: string;
};

export function evaluateEvidenceFreshness(params: {
  collectedAt: Date;
  expiresAt?: Date | null;
  freshnessDays: number;
  now?: Date;
}): FreshnessEvaluation {
  const now = params.now ?? new Date();
  const ageMs = now.getTime() - params.collectedAt.getTime();
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  if (params.expiresAt && params.expiresAt.getTime() < now.getTime()) {
    return {
      fresh: false,
      ageDays,
      freshnessDays: params.freshnessDays,
      reason: "evidence_expired",
    };
  }

  if (ageDays > params.freshnessDays) {
    return {
      fresh: false,
      ageDays,
      freshnessDays: params.freshnessDays,
      reason: "evidence_stale",
    };
  }

  return {
    fresh: true,
    ageDays,
    freshnessDays: params.freshnessDays,
    reason: "evidence_fresh",
  };
}
