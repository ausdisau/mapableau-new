/**
 * Route evidence summary — unknown segments preserved; never claim SAFE.
 */

import type { AccessPathSegment } from "@/lib/access/navigate/types";

import type { RouteEvidenceSummary } from "./types";

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export function buildRouteEvidenceSummary(
  providerId: string,
  segments: AccessPathSegment[],
): RouteEvidenceSummary {
  const segmentSummaries = segments.map((segment) => {
    const known =
      segment.widthMm != null &&
      segment.surfaceType !== "UNKNOWN" &&
      segment.surfaceCondition !== "unknown";
    const verified = segment.lastHumanVerifiedAt != null;
    const warnings: string[] = [];
    if (!known) warnings.push("Segment attributes incomplete");
    if (!verified) warnings.push("Not human-verified");
    if (segment.confidence < LOW_CONFIDENCE_THRESHOLD) {
      warnings.push("Low confidence segment");
    }
    return {
      segmentId: segment.id,
      known,
      verified,
      confidence: segment.confidence,
      warnings,
    };
  });

  const unknownSegmentCount = segmentSummaries.filter((s) => !s.known).length;
  const lowConfidenceSegmentCount = segmentSummaries.filter(
    (s) => s.confidence < LOW_CONFIDENCE_THRESHOLD,
  ).length;

  const warnings: string[] = [];
  if (unknownSegmentCount > 0) {
    warnings.push(
      `${unknownSegmentCount} segment(s) have unknown attributes — route is not fully assessed`,
    );
  }
  if (lowConfidenceSegmentCount > 0) {
    warnings.push(
      `${lowConfidenceSegmentCount} segment(s) have low confidence evidence`,
    );
  }
  warnings.push(
    "This route summary is not a safety guarantee. Conditions may change.",
  );

  let accessAssessment: RouteEvidenceSummary["accessAssessment"] = "assessed";
  if (unknownSegmentCount === segments.length && segments.length > 0) {
    accessAssessment = "unknown";
  } else if (unknownSegmentCount > 0 || lowConfidenceSegmentCount > 0) {
    accessAssessment = "caution";
  }

  return {
    providerId,
    accessAssessment,
    unknownSegmentCount,
    lowConfidenceSegmentCount,
    segmentSummaries,
    warnings,
    safetyClaim: "none",
  };
}

/** Explicit guard — callers must not emit SAFE claims. */
export function assertNoSafeClaim(summary: RouteEvidenceSummary): void {
  if (
    (summary as { accessAssessment?: string }).accessAssessment === "SAFE" ||
    (summary as { safetyClaim?: string }).safetyClaim === "safe"
  ) {
    throw new Error("SAFE route claims are prohibited");
  }
}
