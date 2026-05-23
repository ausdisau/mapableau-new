import { applyHardFilters } from "./hard-filters";
import { scoreCandidate } from "./scoring";
import type { MatchCandidateScore } from "./matching-types";

export function rankProviders(
  providers: {
    id: string;
    verificationStatus?: string;
    status?: string;
    distanceKm?: number;
  }[]
): MatchCandidateScore[] {
  return providers
    .map((p) => {
      const hard = applyHardFilters({
        organisationVerification: p.verificationStatus,
        organisationStatus: p.status,
      });
      if (!hard.passed) {
        return {
          entityId: p.id,
          entityType: "provider" as const,
          totalScore: 0,
          hardFilterPassed: false,
          reasons: hard.reasons,
          warnings: [],
        };
      }
      const scored = scoreCandidate({
        verificationOk: p.verificationStatus === "verified",
        availabilityOk: p.status === "active",
        distanceKm: p.distanceKm,
      });
      return {
        entityId: p.id,
        entityType: "provider" as const,
        totalScore: scored.score,
        hardFilterPassed: true,
        reasons: scored.reasons,
        warnings: [],
      };
    })
    .filter((c) => c.hardFilterPassed)
    .sort((a, b) => b.totalScore - a.totalScore);
}
