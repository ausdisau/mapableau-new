import type { AuraActionRiskTier } from "@prisma/client";

export interface RiskFactors {
  autonomyLevel: 0 | 1 | 2 | 3;
  reversibility: "reversible" | "hard_to_reverse" | "irreversible";
  populationImpact: 0 | 1 | 2 | 3;
  regulatorySensitivity: 0 | 1 | 2 | 3;
  writeCapable: boolean;
  affectsMoney: boolean;
}

export function scoreRisk(factors: RiskFactors): AuraActionRiskTier {
  if (factors.reversibility === "irreversible" && factors.writeCapable) {
    return "high_irreversible";
  }
  const total =
    factors.autonomyLevel +
    factors.populationImpact +
    factors.regulatorySensitivity +
    (factors.reversibility === "hard_to_reverse" ? 2 : 0) +
    (factors.affectsMoney ? 2 : 0);
  if (total >= 7) return "high_irreversible";
  if (total >= 5) return "medium_reversible";
  if (factors.writeCapable) return "low_readwrite";
  return "low_readonly";
}
