/**
 * System 4 — Community Mapper Field Kit + trusted contributor pathway.
 * Pathway level gates evidence *types*, never claim accuracy.
 * Contribution points/badges must not affect confidence.
 */

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";

export const MAPPER_PATHWAY_LEVELS = [
  "new_contributor",
  "trained_mapper",
  "calibrated_mapper",
  "community_reviewer",
  "qualified_assessor",
] as const;

export type MapperPathwayLevel = (typeof MAPPER_PATHWAY_LEVELS)[number];

const PERMITTED_EVIDENCE_TYPES: Record<MapperPathwayLevel, string[]> = {
  new_contributor: ["community_observation", "photograph"],
  trained_mapper: ["community_observation", "photograph", "measurement"],
  calibrated_mapper: [
    "community_observation",
    "photograph",
    "measurement",
    "floor_plan",
  ],
  community_reviewer: [
    "community_observation",
    "photograph",
    "measurement",
    "document",
  ],
  qualified_assessor: [
    "measurement",
    "photograph",
    "video",
    "document",
    "floor_plan",
    "venue_statement",
  ],
};

export function permittedEvidenceTypes(
  level: MapperPathwayLevel,
): string[] {
  return [...PERMITTED_EVIDENCE_TYPES[level]];
}

export function canSubmitEvidenceType(
  level: MapperPathwayLevel,
  evidenceType: string,
): boolean {
  return PERMITTED_EVIDENCE_TYPES[level].includes(evidenceType);
}

/**
 * Invariant: contribution points never enter confidence formulas.
 */
export function contributionMustNotAffectConfidence(input: {
  baseConfidence: number;
  contributionPoints: number;
  badges: number;
}): number {
  void input.contributionPoints;
  void input.badges;
  return input.baseConfidence;
}

export type MapperDraftPayload = {
  accessPlaceId?: string;
  placeNameDraft?: string;
  elementType: string;
  observedVsEstimated: "observed" | "estimated";
  temporaryBarrier?: boolean;
  calibrationMethod?: string;
  imageConsent: boolean;
  locationPrecisionReduced?: boolean;
  notes?: string;
};

export function validateMapperDraft(
  level: MapperPathwayLevel,
  payload: MapperDraftPayload,
  evidenceType: string,
): { ok: true } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  if (!canSubmitEvidenceType(level, evidenceType)) {
    reasons.push(`Pathway ${level} cannot submit ${evidenceType}.`);
  }
  if (evidenceType === "measurement" && !payload.calibrationMethod) {
    reasons.push("Measurements require a calibration method.");
  }
  if (evidenceType === "photograph" && !payload.imageConsent) {
    reasons.push("Explicit consent required before retaining an image as evidence.");
  }
  if (payload.observedVsEstimated !== "observed" && payload.observedVsEstimated !== "estimated") {
    reasons.push("Classify observed versus estimated.");
  }
  return reasons.length ? { ok: false, reasons } : { ok: true };
}

export const MAPPER_PRIVACY_RULES = [
  "no_facial_recognition",
  "no_disability_recognition",
  "no_emotion_recognition",
  "no_cognitive_capacity_inference",
  "no_exact_image_measurement_without_calibration",
  "temporary_image_retention_default",
  "bystander_protections",
  "private_address_restrictions",
  "child_safety_handling",
] as const;

export function assertMapperKitEnabled(): void {
  if (!accessIntelligenceFlags.mapperFieldKit) {
    throw new Error("Mapper field kit disabled.");
  }
}
