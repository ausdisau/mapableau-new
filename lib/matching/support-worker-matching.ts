import { applyHardFilters } from "./hard-filters";
import { explainMatch } from "./explain-match";
import { scoreCandidate } from "./scoring";
import type { MatchCandidateScore } from "./matching-types";

export function rankSupportWorkers(
  workers: {
    id: string;
    verificationStatus?: string;
    organisationVerification?: string;
    isBlocked?: boolean;
    distanceKm?: number;
    isPreferred?: boolean;
    available?: boolean;
  }[]
): MatchCandidateScore[] {
  return workers
    .map((w) => {
      const hard = applyHardFilters({
        verificationStatus: w.verificationStatus,
        organisationVerification: w.organisationVerification,
        isBlocked: w.isBlocked,
        hasRequiredSkill: true,
      });
      if (!hard.passed) {
        return {
          entityId: w.id,
          entityType: "worker" as const,
          totalScore: 0,
          hardFilterPassed: false,
          reasons: hard.reasons,
          warnings: [],
        };
      }
      const scored = scoreCandidate({
        verificationOk: w.verificationStatus === "verified",
        availabilityOk: w.available ?? true,
        distanceKm: w.distanceKm,
        preferenceBoost: w.isPreferred,
      });
      return {
        entityId: w.id,
        entityType: "worker" as const,
        totalScore: scored.score,
        hardFilterPassed: true,
        reasons: scored.reasons,
        warnings:
          w.verificationStatus !== "verified" ? ["Verification pending."] : [],
      };
    })
    .filter((c) => c.hardFilterPassed)
    .sort((a, b) => b.totalScore - a.totalScore);
}

export { explainMatch };
