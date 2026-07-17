/**
 * Bridge VisionAccess candidates into Access Intelligence Next change reviews.
 * Vision outputs remain candidates / estimates — never verified evidence or public writes.
 */

import {
  detectAccessChange,
  storeShadowChangeReview,
  type AccessChangeCandidate,
  type AccessChangeReview,
} from "@/lib/access-intelligence-next/change-detection";
import type { AccessEvidenceClass } from "@/lib/access-intelligence-next/evidence/classes";

import type { GeometryEstimate, PerceptionCandidate } from "./contracts";

function evidenceClassForCandidate(
  candidate: PerceptionCandidate,
): AccessEvidenceClass {
  if (candidate.source === "deterministic_fixture") return "synthetic_fixture";
  if (candidate.source === "local_on_device" || candidate.source === "cloud_model") {
    return "model_candidate";
  }
  return "participant_observation";
}

function ontologyHint(candidate: PerceptionCandidate): string {
  if (candidate.hazardClass) return `vision.hazard.${candidate.hazardClass}`;
  if (candidate.featureClass) return `vision.feature.${candidate.featureClass}`;
  return "vision.candidate.unclassified";
}

/**
 * Map a perception candidate to an Access Intelligence Next change candidate.
 * Does not publish; does not overwrite Living Access Twin evidence.
 */
export function perceptionCandidateToAccessChange(input: {
  candidate: PerceptionCandidate;
  subjectNodeId: string;
  previousValue?: string | number | boolean | null;
  affectedRouteIds?: string[];
}): AccessChangeCandidate {
  const { candidate } = input;
  return {
    candidateId: `vision:${candidate.id}`,
    subjectNodeId: input.subjectNodeId,
    ontologyConceptId: ontologyHint(candidate),
    previousValue: input.previousValue ?? null,
    candidateValue: candidate.label,
    source: `vision_access:${candidate.source}`,
    method: "vision_perception_candidate",
    evidenceClass: evidenceClassForCandidate(candidate),
    observedAt: candidate.createdAt,
    confidenceDimensions: {
      geometric: "low",
      semantic: "medium",
      temporal: "low",
    },
    affectedRouteIds: input.affectedRouteIds ?? [],
    potentialPublicImpact: "none",
    expiryAt: null,
  };
}

/**
 * Geometry estimates always map to device_assisted_estimate — never professional_measurement.
 */
export function geometryEstimateToAccessChange(input: {
  estimate: GeometryEstimate;
  subjectNodeId: string;
  previousValue?: string | number | boolean | null;
}): AccessChangeCandidate {
  const { estimate } = input;
  const interval =
    estimate.valueLow != null && estimate.valueHigh != null
      ? `${estimate.valueLow}–${estimate.valueHigh}${estimate.unit ?? ""}`
      : estimate.displayLabel;

  return {
    candidateId: `vision-geom:${estimate.id}`,
    subjectNodeId: input.subjectNodeId,
    ontologyConceptId: `vision.geometry.${estimate.target}`,
    previousValue: input.previousValue ?? null,
    candidateValue: interval,
    source: `vision_access:geometry:${estimate.method}`,
    method: estimate.method,
    evidenceClass: "device_assisted_estimate",
    observedAt: new Date().toISOString(),
    confidenceDimensions: {
      geometric: "low",
      semantic: "low",
      temporal: "low",
    },
    affectedRouteIds: [],
    potentialPublicImpact: "none",
    expiryAt: null,
  };
}

/**
 * Create a shadow change review from a vision candidate.
 * Auto-overwrite of verified evidence remains blocked by detectAccessChange.
 */
export function submitVisionCandidateForShadowReview(input: {
  candidate: PerceptionCandidate;
  subjectNodeId: string;
  previousValue?: string | number | boolean | null;
  affectedRouteIds?: string[];
}): AccessChangeReview {
  const change = perceptionCandidateToAccessChange(input);
  const review = detectAccessChange(change);
  review.notes = [
    ...review.notes,
    "Vision candidate is provisional",
    "Not a certified measurement",
    "Not published to public map",
    "Absence of detected hazard does not prove safety",
  ];
  return storeShadowChangeReview(review);
}
