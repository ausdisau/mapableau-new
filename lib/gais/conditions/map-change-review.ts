import type { AccessChangeReviewRecord, AccessPlaceLocation } from "@prisma/client";

import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";
import { provenanceStatusToGaisEvidenceState } from "@/lib/gais/service/evidence-mapper";

import { labelAccessConditionEvent } from "./labels";
import type { GaisAccessConditionEvent, GaisAccessConditionType } from "./types";

type ChangeReviewWithPlace = AccessChangeReviewRecord & {
  place?: {
    id: string;
    location: AccessPlaceLocation | null;
  } | null;
};

function conceptToEventType(ontologyConceptId: string): GaisAccessConditionType {
  if (ontologyConceptId === "physical.lift_operational") return "LIFT_OUTAGE";
  if (ontologyConceptId.includes("surface") || ontologyConceptId.includes("clear_width")) {
    return "SURFACE_ISSUE";
  }
  return "OTHER";
}

function reviewEvidence(review: AccessChangeReviewRecord): GaisEvidenceRef[] {
  return [
    {
      id: review.reviewId,
      sourceType: provenanceStatusToGaisEvidenceState("verified"),
      sourceLabel: "Human-reviewed temporary change",
      observedAt: review.createdAt.toISOString(),
      expiresAt: review.expiryAt?.toISOString(),
    },
  ];
}

/**
 * Maps accepted temporary change reviews from Intelligence Next.
 * Only when a place location exists — no fabricated geometry.
 */
export function mapChangeReviewToAccessCondition(
  review: ChangeReviewWithPlace,
): GaisAccessConditionEvent | null {
  if (review.decision !== "accepted_as_temporary") return null;
  if (!review.place?.location) return null;

  const { latitude, longitude } = review.place.location;
  const eventType = conceptToEventType(review.ontologyConceptId);
  const evidence = reviewEvidence(review);

  const event: GaisAccessConditionEvent = {
    id: `gais-condition-review-${review.reviewId}`,
    eventType,
    label: "",
    geometry: { type: "Point", coordinates: [longitude, latitude] },
    placeId: review.place.id,
    description: review.newCandidateSummary,
    reportedAt: review.createdAt.toISOString(),
    expiresAt: review.expiryAt?.toISOString(),
    evidence,
    verificationState: "human_reviewed_temporary",
    source: "change_review",
  };

  event.label = labelAccessConditionEvent(event);
  return event;
}
