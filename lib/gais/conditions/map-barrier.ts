import type { AccessTemporaryBarrier } from "@prisma/client";

import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";
import { barrierVerificationToGaisEvidenceState } from "@/lib/gais/service/evidence-mapper";

import { labelAccessConditionEvent } from "./labels";
import type { GaisAccessConditionEvent, GaisAccessConditionType } from "./types";

function barrierTypeToEventType(
  type: AccessTemporaryBarrier["type"],
  segmentExternalId: string,
): GaisAccessConditionType {
  switch (type) {
    case "blocked_path":
      return segmentExternalId ? "PATH_CLOSURE" : "OBSTRUCTION";
    case "lift_outage":
      return "LIFT_OUTAGE";
    case "construction":
      return "CONSTRUCTION";
    case "poor_surface":
      return "SURFACE_ISSUE";
    case "missing_curb_ramp":
    case "narrow_path":
    case "unsafe_crossing":
    case "other":
    default:
      return "OTHER";
  }
}

function barrierEvidence(barrier: AccessTemporaryBarrier): GaisEvidenceRef[] {
  return [
    {
      id: barrier.id,
      sourceType: barrierVerificationToGaisEvidenceState(barrier.verificationState),
      sourceLabel:
        barrier.verificationState === "community_reported"
          ? "Community reported"
          : barrier.verificationState === "verified"
            ? "Verified"
            : "Unknown",
      observedAt: barrier.reportedAt.toISOString(),
      expiresAt: barrier.expiresAt?.toISOString(),
      confidence: barrier.confidence,
    },
  ];
}

export function mapTemporaryBarrierToAccessCondition(
  barrier: AccessTemporaryBarrier,
): GaisAccessConditionEvent | null {
  if (barrier.latitude == null || barrier.longitude == null) return null;

  const eventType = barrierTypeToEventType(barrier.type, barrier.segmentExternalId);
  const evidence = barrierEvidence(barrier);

  const event: GaisAccessConditionEvent = {
    id: `gais-condition-barrier-${barrier.id}`,
    eventType,
    label: "",
    geometry: {
      type: "Point",
      coordinates: [barrier.longitude, barrier.latitude],
    },
    linkedFeatureId: `gais-barrier-${barrier.id}`,
    segmentExternalId: barrier.segmentExternalId,
    graphId: barrier.graphId,
    description: barrier.description ?? undefined,
    reportedAt: barrier.reportedAt.toISOString(),
    expiresAt: barrier.expiresAt?.toISOString(),
    evidence,
    confidence: barrier.confidence,
    verificationState: barrier.verificationState,
    source: "temporary_barrier",
  };

  event.label = labelAccessConditionEvent(event);
  return event;
}
