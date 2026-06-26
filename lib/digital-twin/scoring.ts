import {
  ASSESSMENT_DOMAINS,
  FEATURE_DOMAIN_MAP,
  SCORING_DISCLAIMER,
  TIER_LABELS,
  TIER_THRESHOLDS,
  type AssessmentDomain,
} from "@/lib/digital-twin/constants";
import type {
  TwinAccessibilityLevel,
  TwinAssessment,
  TwinAssessmentTier,
  TwinConfidenceLevel,
  TwinEvidence,
  TwinFeature,
  TwinPlace,
} from "@/lib/digital-twin/types";

const LEVEL_SCORE: Record<TwinAccessibilityLevel, number> = {
  gold: 100,
  silver: 75,
  bronze: 50,
  fail: 0,
  unknown: 0,
};

const AVAILABILITY_MULTIPLIER: Record<TwinFeature["availability"], number> = {
  available: 1,
  partial: 0.6,
  unavailable: 0,
  unknown: 0.3,
  temporary_unavailable: 0.2,
};

export function calculateFeatureScore(feature: TwinFeature): number {
  const base = LEVEL_SCORE[feature.accessibilityLevel];
  if (feature.accessibilityLevel === "unknown") {
    return 0;
  }
  return Math.round(base * AVAILABILITY_MULTIPLIER[feature.availability]);
}

export function calculateDomainScore(
  features: TwinFeature[],
  domain: AssessmentDomain
): number {
  const domainFeatures = features.filter(
    (f) => FEATURE_DOMAIN_MAP[f.featureType] === domain
  );
  if (domainFeatures.length === 0) return 0;

  const scores = domainFeatures.map(calculateFeatureScore);
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / domainFeatures.length) * 100) / 100;
}

export function determineTier(score: number): TwinAssessmentTier {
  if (score >= TIER_THRESHOLDS.gold) return "gold";
  if (score >= TIER_THRESHOLDS.silver) return "silver";
  if (score >= TIER_THRESHOLDS.bronze) return "bronze";
  return "none";
}

export function tierLabel(tier: TwinAssessmentTier): string {
  return TIER_LABELS[tier] ?? TIER_LABELS.unknown;
}

export function calculateConfidence(
  evidence: TwinEvidence[],
  features: TwinFeature[]
): number {
  if (features.length === 0) return 0;

  let score = 30;
  const approvedEvidence = evidence.filter((e) => e.status !== "rejected");
  score += Math.min(approvedEvidence.length * 5, 30);

  const highConf = approvedEvidence.filter((e) => e.confidence === "high").length;
  score += Math.min(highConf * 8, 24);

  const unknownFeatures = features.filter(
    (f) => f.availability === "unknown" || f.accessibilityLevel === "unknown"
  ).length;
  score -= unknownFeatures * 5;

  const staleFeatures = features.filter((f) => {
    if (!f.lastCheckedAt) return true;
    const age = Date.now() - new Date(f.lastCheckedAt).getTime();
    return age > 365 * 24 * 60 * 60 * 1000;
  }).length;
  score -= staleFeatures * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function confidenceLevelFromScore(score: number): TwinConfidenceLevel {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function getCriticalBarriers(features: TwinFeature[]): string[] {
  const barriers: string[] = [];

  const entrance = features.find((f) => f.featureType === "entrance");
  if (entrance?.availability === "unavailable" || entrance?.accessibilityLevel === "fail") {
    barriers.push("No accessible entrance");
  }

  const toilet = features.find((f) => f.featureType === "toilet");
  if (toilet?.availability === "unavailable") {
    barriers.push("No accessible toilet");
  } else if (toilet?.availability === "unknown") {
    barriers.push("Accessible toilet status needs confirmation");
  }

  const lift = features.find((f) => f.featureType === "lift");
  if (lift?.availability === "unavailable" || lift?.availability === "temporary_unavailable") {
    barriers.push("Lift unavailable");
  }

  for (const f of features) {
    const width = f.measurements?.widthMm ?? f.measurements?.doorwayWidthMm;
    if (typeof width === "number" && width < 850) {
      barriers.push(`Path or doorway may be too narrow (${width}mm)`);
    }
  }

  const narrowCorridor = features.find(
    (f) =>
      f.featureType === "corridor" &&
      typeof f.measurements?.widthMm === "number" &&
      (f.measurements.widthMm as number) < 1200
  );
  if (narrowCorridor) {
    barriers.push("Internal path may be too narrow for larger wheelchairs");
  }

  return [...new Set(barriers)];
}

export function generatePlainLanguageSummary(
  assessment: TwinAssessment,
  features: TwinFeature[]
): string {
  const tier = tierLabel(assessment.tier);
  const barriers = getCriticalBarriers(features);
  const strengths: string[] = [];

  for (const f of features) {
    if (
      f.availability === "available" &&
      (f.accessibilityLevel === "gold" || f.accessibilityLevel === "silver")
    ) {
      strengths.push(f.name);
    }
  }

  const parts: string[] = [`Overall tier: ${tier} (score ${assessment.totalScore}).`];

  if (strengths.length > 0) {
    parts.push(`Works well: ${strengths.slice(0, 3).join(", ")}.`);
  }
  if (barriers.length > 0) {
    parts.push(`May be difficult: ${barriers.slice(0, 3).join("; ")}.`);
  }

  const unknowns = features.filter((f) => f.availability === "unknown");
  if (unknowns.length > 0) {
    parts.push(
      `Needs confirmation: ${unknowns.map((f) => f.name).slice(0, 2).join(", ")}.`
    );
  }

  return parts.join(" ");
}

export function calculateTwinAssessment(
  place: TwinPlace,
  features: TwinFeature[],
  evidence: TwinEvidence[]
): TwinAssessment {
  const placeFeatures = features.filter((f) => f.placeId === place.id);
  const placeEvidence = evidence.filter((e) => e.placeId === place.id);

  const domains: Record<string, number> = {};
  for (const domain of ASSESSMENT_DOMAINS) {
    domains[domain] = calculateDomainScore(placeFeatures, domain);
  }

  const domainValues = Object.values(domains);
  const totalScore =
    domainValues.length > 0
      ? Math.round(
          (domainValues.reduce((a, b) => a + b, 0) / domainValues.length) * 100
        ) / 100
      : 0;

  const tier = determineTier(totalScore);
  const confidence = calculateConfidence(placeEvidence, placeFeatures);

  return {
    id: `assess-${place.id}`,
    placeId: place.id,
    method: "hybrid",
    assessmentDate: new Date().toISOString(),
    domains,
    totalScore,
    tier,
    disclaimer: SCORING_DISCLAIMER,
    nextReviewDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function recalculatePlaceScores(
  place: TwinPlace,
  features: TwinFeature[],
  evidence: TwinEvidence[]
): Pick<TwinPlace, "overallAccessibilityScore" | "confidenceScore" | "accessSummaryPlainLanguage"> {
  const assessment = calculateTwinAssessment(place, features, evidence);
  return {
    overallAccessibilityScore: assessment.totalScore,
    confidenceScore: calculateConfidence(
      evidence.filter((e) => e.placeId === place.id),
      features.filter((f) => f.placeId === place.id)
    ),
    accessSummaryPlainLanguage: generatePlainLanguageSummary(
      assessment,
      features.filter((f) => f.placeId === place.id)
    ),
  };
}
