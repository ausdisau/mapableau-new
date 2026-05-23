import type { MatchReason } from "./matching-types";

export function scoreCandidate(factors: {
  verificationOk: boolean;
  availabilityOk: boolean;
  distanceKm?: number;
  preferenceBoost?: boolean;
}): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  let score = 0;

  if (factors.verificationOk) {
    score += 2;
    reasons.push({
      code: "verified",
      label: "Worker and provider verification acceptable.",
      weight: 2,
    });
  }
  if (factors.availabilityOk) {
    score += 1.5;
    reasons.push({
      code: "available",
      label: "Available for your requested time.",
      weight: 1.5,
    });
  }
  if (factors.distanceKm != null && factors.distanceKm < 15) {
    score += 1;
    reasons.push({
      code: "nearby",
      label: "Located close to your area.",
      weight: 1,
    });
  }
  if (factors.preferenceBoost) {
    score += 2;
    reasons.push({
      code: "preferred",
      label: "On your preferred workers list.",
      weight: 2,
    });
  }

  return { score, reasons };
}
