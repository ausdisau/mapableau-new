import type { GaisEvidenceState } from "@/lib/gais/contracts/evidence";
import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import type { GaisFeature } from "@/lib/gais/contracts/feature";

export type GaisGeoJsonFeatureProperties = {
  gaisFeatureId: string;
  gaisFeatureType: string;
  gaisEvidenceState: GaisEvidenceState;
  gaisEvidenceLabel: string;
  name?: string;
  placeId?: string;
  observedAt?: string;
  validUntil?: string;
  confidence?: number;
  /** Known facts only — absent keys mean unknown, not accessible. */
  facts: Record<string, string | number | boolean>;
  evidence: Array<{
    sourceType: GaisEvidenceState;
    sourceLabel?: string;
    observedAt?: string;
    expiresAt?: string;
    confidence?: number;
  }>;
  /** What we know labels for UI */
  knownAttributes: Array<{ label: string; value: string }>;
  unknownAttributes: string[];
};

export type GaisGeoJsonFeature = {
  type: "Feature";
  id: string;
  geometry: GaisFeature["geometry"];
  properties: GaisGeoJsonFeatureProperties;
};

export type GaisGeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GaisGeoJsonFeature[];
  meta: {
    claimState: string;
    evidenceScope: string;
    generatedAt: string;
    liveNationalRouting: false;
    featureCount: number;
  };
};

function primaryEvidenceState(feature: GaisFeature): GaisEvidenceState {
  if (!feature.evidence.length) return "UNKNOWN";
  const priority: GaisEvidenceState[] = [
    "VERIFIED",
    "AUTHORITATIVE_SOURCE",
    "PROVIDER_OR_VENUE_DECLARED",
    "SENSOR_OBSERVED",
    "COMMUNITY_REPORTED",
    "AI_INFERRED",
    "UNKNOWN",
  ];
  for (const state of priority) {
    if (feature.evidence.some((e) => e.sourceType === state)) return state;
  }
  return "UNKNOWN";
}

const FACT_LABELS: Record<string, string> = {
  stepFree: "Step-free",
  automaticDoor: "Automatic door",
  liftAvailable: "Lift available",
  widthMm: "Width",
  gradientPercent: "Gradient",
  surface: "Surface",
  barrierType: "Condition type",
};

function buildKnownUnknownAttributes(
  feature: GaisFeature,
): { known: Array<{ label: string; value: string }>; unknown: string[] } {
  const known: Array<{ label: string; value: string }> = [];
  const unknown: string[] = [];

  const checkKeys =
    feature.type === "TEMPORARY_BARRIER"
      ? (["barrierType", "description"] as const)
      : feature.type === "ENTRANCE"
        ? (["stepFree", "automaticDoor", "widthMm"] as const)
        : feature.type === "LIFT"
          ? (["liftAvailable"] as const)
          : ([] as const);

  for (const key of checkKeys) {
    const label = FACT_LABELS[key] ?? key;
    const value = feature.properties[key];
    if (value === undefined || value === null) {
      unknown.push(label);
    } else {
      known.push({ label, value: String(value) });
    }
  }

  if (feature.type === "ENTRANCE" && feature.properties.accessFeatureTag === "step_free_entry") {
    if (!known.some((k) => k.label === "Step-free")) {
      unknown.push("Step-free");
    }
  }

  return { known, unknown };
}

export function gaisFeatureToGeoJson(feature: GaisFeature): GaisGeoJsonFeature {
  const evidenceState = primaryEvidenceState(feature);
  const { known, unknown } = buildKnownUnknownAttributes(feature);

  const facts: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(feature.properties)) {
    if (
      value !== undefined &&
      value !== null &&
      !["reporterUserId", "userId", "participantId", "createdById"].includes(key)
    ) {
      facts[key] = value;
    }
  }

  const primaryEvidence = feature.evidence[0];
  const confidence = primaryEvidence?.confidence;

  return {
    type: "Feature",
    id: feature.id,
    geometry: feature.geometry,
    properties: {
      gaisFeatureId: feature.id,
      gaisFeatureType: feature.type,
      gaisEvidenceState: evidenceState,
      gaisEvidenceLabel: GAIS_EVIDENCE_STATE_LABELS[evidenceState],
      name: feature.name,
      placeId: feature.placeId,
      observedAt: feature.observedAt,
      validUntil: feature.validUntil,
      confidence,
      facts,
      evidence: feature.evidence.map((e) => ({
        sourceType: e.sourceType,
        sourceLabel: e.sourceLabel,
        observedAt: e.observedAt,
        expiresAt: e.expiresAt,
        confidence: e.confidence,
      })),
      knownAttributes: known,
      unknownAttributes: unknown,
    },
  };
}

export function gaisFeaturesToFeatureCollection(
  features: GaisFeature[],
  meta: {
    claimState: string;
    evidenceScope: string;
    generatedAt?: string;
  },
): GaisGeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map(gaisFeatureToGeoJson),
    meta: {
      claimState: meta.claimState,
      evidenceScope: meta.evidenceScope,
      generatedAt: meta.generatedAt ?? new Date().toISOString(),
      liveNationalRouting: false,
      featureCount: features.length,
    },
  };
}
