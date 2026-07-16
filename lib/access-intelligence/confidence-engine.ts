import {
  confidenceLabelThresholds,
  featureFreshnessDays,
  sourceReliabilityDefaults,
} from "./configuration";
import type {
  AccessFeature,
  ConfidenceLabel,
  Evidence,
  SourceType,
} from "./schemas";

export type ConfidenceInput = {
  features: AccessFeature[];
  evidence: Evidence[];
  now?: Date;
  coverageExpectedFeatureTypes?: string[];
  liveFeedAgeHours?: number | null;
};

export type ConfidenceResult = {
  numeric: number;
  label: ConfidenceLabel;
  factors: {
    sourceReliability: number;
    ageFactor: number;
    corroborationFactor: number;
    disputePenalty: number;
    coverageFactor: number;
    liveFeedFactor: number;
  };
  explanation: string;
};

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function freshnessWindowDays(featureType: string): number {
  return (
    featureFreshnessDays[featureType] ??
    featureFreshnessDays.default ??
    180
  );
}

function ageFactorForFeature(feature: AccessFeature, now: Date): number {
  const ageDays = daysBetween(new Date(feature.observedAt), now);
  const window = freshnessWindowDays(feature.featureType);
  if (ageDays <= window * 0.5) return 1;
  if (ageDays <= window) return 0.75;
  if (ageDays <= window * 2) return 0.45;
  return 0.2;
}

function labelForScore(score: number): ConfidenceLabel {
  if (score >= confidenceLabelThresholds.high) return "high";
  if (score >= confidenceLabelThresholds.moderate) return "moderate";
  if (score >= confidenceLabelThresholds.limited) return "limited";
  return "very limited";
}

/**
 * Deterministic evidence confidence (0–100).
 * Combines source reliability, age, corroboration, disputes, coverage, and live feed recency.
 */
export function calculateEvidenceConfidence(
  input: ConfidenceInput,
): ConfidenceResult {
  const now = input.now ?? new Date();
  const features = input.features;
  const evidenceById = new Map(input.evidence.map((e) => [e.id, e]));

  if (features.length === 0) {
    return {
      numeric: 0,
      label: "very limited",
      factors: {
        sourceReliability: 0,
        ageFactor: 0,
        corroborationFactor: 0,
        disputePenalty: 0,
        coverageFactor: 0,
        liveFeedFactor: 0,
      },
      explanation:
        "No access features are available for this place, so evidence confidence is very limited.",
    };
  }

  let sourceSum = 0;
  let ageSum = 0;
  let disputedCount = 0;
  let aiInferenceCount = 0;
  let corroborationBonus = 0;

  for (const feature of features) {
    const reliability =
      sourceReliabilityDefaults[feature.sourceType as SourceType] ?? 0.5;
    sourceSum += reliability;
    ageSum += ageFactorForFeature(feature, now);
    if (feature.disputed) disputedCount += 1;
    if (feature.sourceType === "ai_inference") aiInferenceCount += 1;

    const related = feature.evidenceIds
      .map((id) => evidenceById.get(id))
      .filter(Boolean);
    const verifiedCount = related.filter((e) => e?.status === "verified").length;
    const disputedEvidence = related.filter((e) => e?.status === "disputed").length;
    if (verifiedCount >= 2) corroborationBonus += 0.05;
    if (disputedEvidence > 0) disputedCount += 1;

    // Conflicting values for the same feature type / element
    const siblings = features.filter(
      (f) =>
        f.featureType === feature.featureType &&
        f.elementId === feature.elementId &&
        f.id !== feature.id,
    );
    for (const sibling of siblings) {
      if (String(sibling.value) !== String(feature.value)) {
        disputedCount += 1;
      }
    }
  }

  const sourceReliability = sourceSum / features.length;
  const ageFactor = ageSum / features.length;
  const corroborationFactor = Math.min(1, 0.7 + corroborationBonus);
  const disputePenalty = Math.max(0, 1 - disputedCount * 0.2);
  const aiPenalty = aiInferenceCount > 0 ? Math.max(0.5, 1 - aiInferenceCount * 0.15) : 1;

  const expected = input.coverageExpectedFeatureTypes ?? [];
  const presentTypes = new Set(features.map((f) => f.featureType));
  const coverageFactor =
    expected.length === 0
      ? 1
      : expected.filter((t) => presentTypes.has(t as never)).length /
        expected.length;

  let liveFeedFactor = 1;
  if (input.liveFeedAgeHours == null) {
    liveFeedFactor = 0.85;
  } else if (input.liveFeedAgeHours <= 2) {
    liveFeedFactor = 1;
  } else if (input.liveFeedAgeHours <= 24) {
    liveFeedFactor = 0.9;
  } else if (input.liveFeedAgeHours <= 72) {
    liveFeedFactor = 0.7;
  } else {
    liveFeedFactor = 0.5;
  }

  const combined =
    sourceReliability *
    ageFactor *
    corroborationFactor *
    disputePenalty *
    aiPenalty *
    Math.max(0.3, coverageFactor) *
    liveFeedFactor;

  const numeric = Math.round(Math.max(0, Math.min(1, combined)) * 100);
  const label = labelForScore(numeric);

  const parts: string[] = [];
  if (ageFactor < 0.75) parts.push("some evidence is outdated");
  if (disputedCount > 0) parts.push("conflicting or disputed evidence is present");
  if (aiInferenceCount > 0)
    parts.push("AI inferences are included and are not treated as measurements");
  if (coverageFactor < 1) parts.push("feature coverage is incomplete");
  if (liveFeedFactor < 0.9) parts.push("live status feed is not fully recent");

  const explanation =
    parts.length === 0
      ? `Evidence confidence is ${label} (${numeric}/100) based on source reliability and freshness.`
      : `Evidence confidence is ${label} (${numeric}/100): ${parts.join("; ")}.`;

  return {
    numeric,
    label,
    factors: {
      sourceReliability: Math.round(sourceReliability * 100) / 100,
      ageFactor: Math.round(ageFactor * 100) / 100,
      corroborationFactor: Math.round(corroborationFactor * 100) / 100,
      disputePenalty: Math.round(disputePenalty * 100) / 100,
      coverageFactor: Math.round(coverageFactor * 100) / 100,
      liveFeedFactor: Math.round(liveFeedFactor * 100) / 100,
    },
    explanation,
  };
}
