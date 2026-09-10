/**
 * MapAble compatibility overlay — engine "accessible" never bypasses requirements.
 */

import type { AccessPathSegment } from "@/lib/access/navigate/types";
import type { MobilityRoutingConstraints } from "@/lib/access/navigate/types";
import {
  segmentExcludedByPolicy,
  segmentPassesHardConstraints,
} from "@/lib/access/navigate/scoring";

export type OverlayResult = {
  allowed: boolean;
  engineClaimedAccessible: boolean;
  mapablePassesHardConstraints: boolean;
  mapablePassesPolicy: boolean;
  reasons: string[];
};

/**
 * External routing engines may label segments "accessible".
 * MapAble overlay re-evaluates against mobility constraints — never trusts engine label alone.
 */
export function applyMapAbleCompatibilityOverlay(
  segment: AccessPathSegment,
  constraints: MobilityRoutingConstraints,
  engineAccessibleLabel?: boolean,
): OverlayResult {
  const engineClaimedAccessible = engineAccessibleLabel === true;
  const mapablePassesHardConstraints = segmentPassesHardConstraints(
    segment,
    constraints,
  );
  const mapablePassesPolicy = !segmentExcludedByPolicy(segment, constraints);

  const reasons: string[] = [];
  if (engineClaimedAccessible && !mapablePassesHardConstraints) {
    reasons.push(
      "Engine marked accessible but segment fails MapAble hard constraints",
    );
  }
  if (engineClaimedAccessible && !mapablePassesPolicy) {
    reasons.push(
      "Engine marked accessible but segment excluded by MapAble policy",
    );
  }
  if (segment.widthMm == null) {
    reasons.push("Segment width unknown — not treated as verified capability");
  }
  if (segment.surfaceType === "UNKNOWN") {
    reasons.push("Surface type unknown — caution required");
  }

  const allowed =
    mapablePassesHardConstraints &&
    mapablePassesPolicy &&
  // Engine label alone is never sufficient
    (engineClaimedAccessible ? mapablePassesHardConstraints : true);

  return {
    allowed,
    engineClaimedAccessible,
    mapablePassesHardConstraints,
    mapablePassesPolicy,
    reasons,
  };
}

export function filterSegmentsWithOverlay(
  segments: AccessPathSegment[],
  constraints: MobilityRoutingConstraints,
  engineLabels?: Record<string, boolean>,
): AccessPathSegment[] {
  return segments.filter((segment) => {
    const overlay = applyMapAbleCompatibilityOverlay(
      segment,
      constraints,
      engineLabels?.[segment.id],
    );
    return overlay.allowed;
  });
}
