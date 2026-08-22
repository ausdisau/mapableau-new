import type { GaisFeature } from "@/lib/gais/contracts/feature";
import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";

import type {
  AccessRequirements,
  CompatibilityEvaluation,
  CompatibilityResult,
  CompatibilityRuleEvaluation,
} from "./contracts";

function worstResult(results: CompatibilityResult[]): CompatibilityResult {
  const priority: CompatibilityResult[] = [
    "KNOWN_CONFLICT",
    "REQUIRES_MORE_INFORMATION",
    "POTENTIAL_DIFFICULTY",
    "UNKNOWN",
    "COMPATIBLE_WITH_KNOWN_FACTS",
  ];
  for (const level of priority) {
    if (results.includes(level)) return level;
  }
  return "REQUIRES_MORE_INFORMATION";
}

function rule(
  requirement: string,
  observedValue: string | number | boolean | null,
  result: CompatibilityResult,
  evidence: GaisEvidenceRef[] | null,
  explanation: string,
): CompatibilityRuleEvaluation {
  return { requirement, observedValue, result, evidence, explanation };
}

function featureEvidence(feature: GaisFeature): GaisEvidenceRef[] | null {
  return feature.evidence.length ? feature.evidence : null;
}

function evaluateWidth(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityRuleEvaluation | null {
  if (requirements.minimumWidthMm == null) return null;

  const observed = feature.properties.widthMm;
  const reqLabel = `Minimum width ${requirements.minimumWidthMm} mm`;

  if (observed == null) {
    return rule(
      reqLabel,
      null,
      "UNKNOWN",
      featureEvidence(feature),
      "Path or opening width has not been recorded for this feature.",
    );
  }

  if (observed < requirements.minimumWidthMm) {
    return rule(
      reqLabel,
      observed,
      "KNOWN_CONFLICT",
      featureEvidence(feature),
      `Recorded width is ${observed} mm, below your minimum of ${requirements.minimumWidthMm} mm.`,
    );
  }

  return rule(
    reqLabel,
    observed,
    "COMPATIBLE_WITH_KNOWN_FACTS",
    featureEvidence(feature),
    `Recorded width is ${observed} mm, meeting your minimum of ${requirements.minimumWidthMm} mm.`,
  );
}

function evaluateGradient(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityRuleEvaluation | null {
  if (requirements.maximumPreferredGradientPercent == null) return null;

  const observed = feature.properties.gradientPercent;
  const reqLabel = `Maximum preferred gradient ${requirements.maximumPreferredGradientPercent}%`;

  if (observed == null) {
    return rule(
      reqLabel,
      null,
      "UNKNOWN",
      featureEvidence(feature),
      "Gradient has not been recorded for this feature.",
    );
  }

  if (observed > requirements.maximumPreferredGradientPercent) {
    return rule(
      reqLabel,
      observed,
      "POTENTIAL_DIFFICULTY",
      featureEvidence(feature),
      `Recorded gradient is ${observed}%, above your preferred maximum of ${requirements.maximumPreferredGradientPercent}%.`,
    );
  }

  return rule(
    reqLabel,
    observed,
    "COMPATIBLE_WITH_KNOWN_FACTS",
    featureEvidence(feature),
    `Recorded gradient is ${observed}%, within your preferred maximum of ${requirements.maximumPreferredGradientPercent}%.`,
  );
}

function evaluateCrossSlope(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityRuleEvaluation | null {
  if (requirements.maximumPreferredCrossSlopePercent == null) return null;

  const observed = feature.properties.crossSlopePercent;
  const reqLabel = `Maximum preferred cross-slope ${requirements.maximumPreferredCrossSlopePercent}%`;

  if (observed == null) {
    return rule(
      reqLabel,
      null,
      "UNKNOWN",
      featureEvidence(feature),
      "Cross-slope has not been recorded for this feature.",
    );
  }

  if (observed > requirements.maximumPreferredCrossSlopePercent) {
    return rule(
      reqLabel,
      observed,
      "POTENTIAL_DIFFICULTY",
      featureEvidence(feature),
      `Recorded cross-slope is ${observed}%, above your preferred maximum of ${requirements.maximumPreferredCrossSlopePercent}%.`,
    );
  }

  return rule(
    reqLabel,
    observed,
    "COMPATIBLE_WITH_KNOWN_FACTS",
    featureEvidence(feature),
    `Recorded cross-slope is ${observed}%, within your preferred maximum of ${requirements.maximumPreferredCrossSlopePercent}%.`,
  );
}

function evaluateThreshold(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityRuleEvaluation | null {
  if (requirements.maximumPreferredThresholdMm == null) return null;

  const threshold = feature.properties.thresholdHeightMm;
  const kerb = feature.properties.kerbHeightMm;
  const observed = threshold ?? kerb;
  const reqLabel = `Maximum preferred threshold ${requirements.maximumPreferredThresholdMm} mm`;

  if (observed == null) {
    return rule(
      reqLabel,
      null,
      "UNKNOWN",
      featureEvidence(feature),
      "Threshold or kerb height has not been recorded for this feature.",
    );
  }

  if (observed > requirements.maximumPreferredThresholdMm) {
    return rule(
      reqLabel,
      observed,
      "POTENTIAL_DIFFICULTY",
      featureEvidence(feature),
      `Recorded threshold/kerb is ${observed} mm, above your preferred maximum of ${requirements.maximumPreferredThresholdMm} mm.`,
    );
  }

  return rule(
    reqLabel,
    observed,
    "COMPATIBLE_WITH_KNOWN_FACTS",
    featureEvidence(feature),
    `Recorded threshold/kerb is ${observed} mm, within your preferred maximum of ${requirements.maximumPreferredThresholdMm} mm.`,
  );
}

function evaluateStepFree(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityRuleEvaluation | null {
  if (!requirements.requiresStepFree) return null;

  const reqLabel = "Step-free access required";
  const observed = feature.properties.stepFree;

  // Feature tags (e.g. step_free_entry) do not establish stepFree=true.
  if (observed == null) {
    return rule(
      reqLabel,
      null,
      "UNKNOWN",
      featureEvidence(feature),
      "Step-free status has not been verified for this feature.",
    );
  }

  if (observed === false) {
    return rule(
      reqLabel,
      false,
      "KNOWN_CONFLICT",
      featureEvidence(feature),
      "Recorded data indicates this feature is not step-free.",
    );
  }

  return rule(
    reqLabel,
    true,
    "COMPATIBLE_WITH_KNOWN_FACTS",
    featureEvidence(feature),
    "Recorded data indicates step-free access.",
  );
}

function evaluateLift(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityRuleEvaluation | null {
  if (!requirements.requiresLift) return null;

  const reqLabel = "Lift required";
  const observed = feature.properties.liftAvailable;

  if (observed == null) {
    return rule(
      reqLabel,
      null,
      "UNKNOWN",
      featureEvidence(feature),
      "Lift availability has not been verified for this feature.",
    );
  }

  if (observed === false) {
    return rule(
      reqLabel,
      false,
      "KNOWN_CONFLICT",
      featureEvidence(feature),
      "Recorded data indicates a lift is not available.",
    );
  }

  return rule(
    reqLabel,
    true,
    "COMPATIBLE_WITH_KNOWN_FACTS",
    featureEvidence(feature),
    "Recorded data indicates a lift is available.",
  );
}

function evaluateSurface(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityRuleEvaluation | null {
  const hasPreferred = (requirements.preferredSurfaces?.length ?? 0) > 0;
  const hasAvoided = (requirements.avoidedSurfaces?.length ?? 0) > 0;
  if (!hasPreferred && !hasAvoided) return null;

  const observed = feature.properties.surface;
  const reqLabel = "Surface preference";

  if (observed == null || observed === "UNKNOWN") {
    return rule(
      reqLabel,
      null,
      "UNKNOWN",
      featureEvidence(feature),
      "Surface type has not been recorded for this feature.",
    );
  }

  const normalized = String(observed).toUpperCase();
  const avoided = (requirements.avoidedSurfaces ?? []).map((s) => s.toUpperCase());
  const preferred = (requirements.preferredSurfaces ?? []).map((s) => s.toUpperCase());

  if (avoided.includes(normalized)) {
    return rule(
      reqLabel,
      observed,
      "POTENTIAL_DIFFICULTY",
      featureEvidence(feature),
      `Surface "${observed}" is on your avoided list.`,
    );
  }

  if (hasPreferred && !preferred.includes(normalized)) {
    return rule(
      reqLabel,
      observed,
      "POTENTIAL_DIFFICULTY",
      featureEvidence(feature),
      `Surface "${observed}" is not among your preferred surfaces.`,
    );
  }

  return rule(
    reqLabel,
    observed,
    "COMPATIBLE_WITH_KNOWN_FACTS",
    featureEvidence(feature),
    `Surface "${observed}" matches your preferences.`,
  );
}

function evaluateTemporaryBarrier(feature: GaisFeature): CompatibilityRuleEvaluation | null {
  if (feature.type !== "TEMPORARY_BARRIER") return null;

  const barrierType = feature.properties.barrierType ?? "other";
  return rule(
    "Temporary condition reported",
    barrierType,
    "KNOWN_CONFLICT",
    featureEvidence(feature),
    `A temporary condition (${String(barrierType).replace(/_/g, " ")}) is reported at or near this location.`,
  );
}

function hasAnyRequirement(requirements: AccessRequirements): boolean {
  return (
    requirements.minimumWidthMm != null ||
    requirements.maximumPreferredGradientPercent != null ||
    requirements.maximumPreferredCrossSlopePercent != null ||
    requirements.maximumPreferredThresholdMm != null ||
    requirements.requiresStepFree === true ||
    requirements.requiresLift === true ||
    (requirements.preferredSurfaces?.length ?? 0) > 0 ||
    (requirements.avoidedSurfaces?.length ?? 0) > 0
  );
}

/**
 * Deterministic compatibility evaluation — no LLM, no assume-pass.
 * Compares known environmental facts with user-configured requirements.
 */
export function evaluateCompatibility(
  feature: GaisFeature,
  requirements: AccessRequirements,
): CompatibilityEvaluation {
  if (!hasAnyRequirement(requirements)) {
    return {
      overall: "REQUIRES_MORE_INFORMATION",
      rules: [],
      unknowns: ["No access requirements were provided."],
      matches: [],
      difficulties: [],
      conflicts: [],
    };
  }

  const rules: CompatibilityRuleEvaluation[] = [
    evaluateTemporaryBarrier(feature),
    evaluateWidth(feature, requirements),
    evaluateGradient(feature, requirements),
    evaluateCrossSlope(feature, requirements),
    evaluateThreshold(feature, requirements),
    evaluateStepFree(feature, requirements),
    evaluateLift(feature, requirements),
    evaluateSurface(feature, requirements),
  ].filter((r): r is CompatibilityRuleEvaluation => r != null);

  const unknowns = rules
    .filter((r) => r.result === "UNKNOWN")
    .map((r) => r.requirement);

  const matches = rules.filter((r) => r.result === "COMPATIBLE_WITH_KNOWN_FACTS");
  const difficulties = rules.filter((r) => r.result === "POTENTIAL_DIFFICULTY");
  const conflicts = rules.filter(
    (r) => r.result === "KNOWN_CONFLICT" || r.result === "REQUIRES_MORE_INFORMATION",
  );

  const overall = worstResult(rules.map((r) => r.result));

  return {
    overall,
    rules,
    unknowns,
    matches,
    difficulties,
    conflicts,
  };
}
