import type { GaisEvidenceState } from "@/lib/gais/contracts/evidence";
import type { GaisFeature } from "@/lib/gais/contracts/feature";
import type { GaisFeatureType } from "@/lib/gais/contracts/feature-types";
import {
  evaluateCompatibility,
  type AccessRequirements,
  type CompatibilityResult,
} from "@/lib/gais/compatibility";

import type { GaisQueryScope } from "./constants";
import type { GaisStructuredQuery } from "./request-schema";

export type GaisQueryResultItem = {
  feature: GaisFeature;
  scope: GaisQueryScope;
  reason: string;
  distanceMetres?: number;
};

const EVIDENCE_PRIORITY: GaisEvidenceState[] = [
  "VERIFIED",
  "AUTHORITATIVE_SOURCE",
  "PROVIDER_OR_VENUE_DECLARED",
  "SENSOR_OBSERVED",
  "COMMUNITY_REPORTED",
  "AI_INFERRED",
  "UNKNOWN",
];

function primaryEvidenceState(feature: GaisFeature): GaisEvidenceState {
  for (const state of EVIDENCE_PRIORITY) {
    if (feature.evidence.some((e) => e.sourceType === state)) return state;
  }
  return "UNKNOWN";
}

function hasUnknownAccessibilityData(feature: GaisFeature): boolean {
  switch (feature.type) {
    case "ENTRANCE":
      return feature.properties.stepFree == null;
    case "LIFT":
      return feature.properties.liftAvailable == null;
    case "PATH":
    case "RAMP":
      return feature.properties.widthMm == null && feature.properties.gradientPercent == null;
    case "TOILET":
      return primaryEvidenceState(feature) === "UNKNOWN";
    default:
      return primaryEvidenceState(feature) === "UNKNOWN";
  }
}

function compatibilityToScope(result: CompatibilityResult): GaisQueryScope {
  switch (result) {
    case "COMPATIBLE_WITH_KNOWN_FACTS":
      return "MATCHED_KNOWN_FACTS";
    case "KNOWN_CONFLICT":
      return "KNOWN_CONFLICTS";
    case "UNKNOWN":
    case "REQUIRES_MORE_INFORMATION":
    case "POTENTIAL_DIFFICULTY":
    default:
      return "UNKNOWN";
  }
}

function classifyStepFreeEntrance(feature: GaisFeature): GaisQueryScope {
  if (feature.type !== "ENTRANCE" && feature.properties.accessFeatureTag !== "step_free_entry") {
    return "UNKNOWN";
  }
  if (feature.properties.stepFree === true) return "MATCHED_KNOWN_FACTS";
  if (feature.properties.stepFree === false) return "KNOWN_CONFLICTS";
  return "UNKNOWN";
}

function classifyAccessibleToilet(feature: GaisFeature): GaisQueryScope {
  const isToilet =
    feature.type === "TOILET" || feature.properties.accessFeatureTag === "accessible_toilet";
  if (!isToilet) return "UNKNOWN";

  const evidence = primaryEvidenceState(feature);
  if (evidence === "UNKNOWN") return "UNKNOWN";
  return "MATCHED_KNOWN_FACTS";
}

export function filterFeatureByQuery(
  feature: GaisFeature,
  query: GaisStructuredQuery,
): boolean {
  if (query.featureTypes?.length && !query.featureTypes.includes(feature.type as GaisFeatureType)) {
    return false;
  }

  if (query.accessFeatureTags?.length) {
    const tag = feature.properties.accessFeatureTag;
    if (!tag || !query.accessFeatureTags.includes(String(tag))) return false;
  }

  if (query.unknownOnly && !hasUnknownAccessibilityData(feature)) {
    return false;
  }

  return true;
}

export function classifyFeatureScope(
  feature: GaisFeature,
  query: GaisStructuredQuery,
): GaisQueryResultItem {
  if (query.requirements && Object.keys(query.requirements).length > 0) {
    const evaluation = evaluateCompatibility(feature, query.requirements as AccessRequirements);
    const scope = compatibilityToScope(evaluation.overall);
    const reason =
      evaluation.rules.find((r) => compatibilityToScope(r.result) === scope)?.explanation ??
      evaluation.rules[0]?.explanation ??
      "Evaluated against stated requirements";

    return { feature, scope, reason };
  }

  if (query.evidenceRequirements?.requiresKnownStepFreeEntrance) {
    const scope = classifyStepFreeEntrance(feature);
    return {
      feature,
      scope,
      reason:
        scope === "MATCHED_KNOWN_FACTS"
          ? "Step-free entrance verified in recorded data"
          : scope === "KNOWN_CONFLICTS"
            ? "Recorded data indicates entrance is not step-free"
            : "Step-free entrance status not verified — feature tag alone is insufficient",
    };
  }

  if (query.evidenceRequirements?.requiresAccessibleToiletEvidence) {
    const scope = classifyAccessibleToilet(feature);
    return {
      feature,
      scope,
      reason:
        scope === "MATCHED_KNOWN_FACTS"
          ? "Accessible toilet reported with non-unknown evidence"
          : "Accessible toilet evidence insufficient or unknown",
    };
  }

  if (query.unknownOnly) {
    return {
      feature,
      scope: "UNKNOWN",
      reason: "Accessibility attribute data is incomplete for this feature",
    };
  }

  return {
    feature,
    scope: hasUnknownAccessibilityData(feature) ? "UNKNOWN" : "MATCHED_KNOWN_FACTS",
    reason: hasUnknownAccessibilityData(feature)
      ? "Some accessibility attributes are not recorded"
      : "Feature has recorded accessibility attributes",
  };
}

export function groupResultsByScope(items: GaisQueryResultItem[]): Record<
  GaisQueryScope,
  GaisQueryResultItem[]
> {
  return {
    MATCHED_KNOWN_FACTS: items.filter((i) => i.scope === "MATCHED_KNOWN_FACTS"),
    KNOWN_CONFLICTS: items.filter((i) => i.scope === "KNOWN_CONFLICTS"),
    UNKNOWN: items.filter((i) => i.scope === "UNKNOWN"),
  };
}

export function sortResultsDeterministically(items: GaisQueryResultItem[]): GaisQueryResultItem[] {
  return [...items].sort((a, b) => a.feature.id.localeCompare(b.feature.id));
}

export { hasUnknownAccessibilityData, primaryEvidenceState };
