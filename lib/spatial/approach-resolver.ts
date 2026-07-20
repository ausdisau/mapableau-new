import { createGeoscapeSourceReference } from "@/lib/spatial/provenance";
import type {
  AccessApproachCandidate,
  AccessApproachReviewDecision,
} from "@/lib/spatial/approach-types";
import type { SpatialCandidateStatus } from "@/lib/spatial/types";

/**
 * Synthetic civic-centre pilot candidates (Harbour Civic).
 * Geoscape-derived geometry is not present — status remains inferred until review.
 */
export function listSyntheticCivicApproachCandidates(
  now = new Date(),
): AccessApproachCandidate[] {
  const retrievedAt = now.toISOString();
  const spatialStub = createGeoscapeSourceReference({
    product: "buildings",
    endpoint: "synthetic://harbour-civic",
    dataset: "synthetic_pilot",
    retrievedAt,
    licenceIdentifier: "synthetic-not-licensed",
  });

  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      candidateId: "harbour_civic.entrance_west",
      placeId: "harbour_civic",
      placeLabel: "Harbour Civic Centre (synthetic)",
      formattedAddress: "Synthetic Civic Precinct, Sydney NSW",
      buildingLabel: "West wing",
      candidateType: "step_free_entrance",
      latitude: -33.861,
      longitude: 151.209,
      source: spatialStub,
      evidence: [
        "Synthetic fixture for Starting Work / AccessCast pilots",
        "Not a verified accessible entrance",
      ],
      accessibleCharacteristics: ["step_free_candidate", "wide_door_candidate"],
      status: "inferred",
      confidence: "low",
      expiresAt,
      disclosure: "public_candidate",
    },
    {
      candidateId: "harbour_civic.dropoff_forecourt",
      placeId: "harbour_civic",
      placeLabel: "Harbour Civic Centre (synthetic)",
      formattedAddress: "Synthetic Civic Precinct, Sydney NSW",
      buildingLabel: "Forecourt",
      candidateType: "drop_off_point",
      latitude: -33.8612,
      longitude: 151.2088,
      source: { kind: "mapable_synthetic", label: "Harbour synthetic drop-off" },
      evidence: ["Synthetic vehicle drop-off candidate for pilot journeys"],
      accessibleCharacteristics: ["vehicle_dropoff_candidate"],
      status: "inferred",
      confidence: "low",
      expiresAt,
      disclosure: "public_candidate",
    },
    {
      candidateId: "harbour_civic.pickup_kerb",
      placeId: "harbour_civic",
      placeLabel: "Harbour Civic Centre (synthetic)",
      candidateType: "pickup_point",
      source: { kind: "mapable_synthetic", label: "Harbour synthetic pickup" },
      evidence: ["Synthetic pickup point — confirm with participant before use"],
      accessibleCharacteristics: [],
      status: "inferred",
      confidence: "unknown",
      expiresAt,
      disclosure: "public_candidate",
    },
  ];
}

function decisionToStatus(
  decision: AccessApproachReviewDecision,
): SpatialCandidateStatus {
  switch (decision) {
    case "confirmed":
      return "participant_confirmed";
    case "rejected":
      return "rejected";
    case "needs_more_evidence":
      return "inferred";
    default: {
      const _exhaustive: never = decision;
      return _exhaustive;
    }
  }
}

/**
 * Apply a human review decision. Venue confirmation must be passed as reviewerRole;
 * participant reports win over venue when conflicted (caller supplies final decision).
 */
export function reviewApproachCandidate(
  candidate: AccessApproachCandidate,
  input: {
    decision: AccessApproachReviewDecision;
    reviewer: string;
    reviewerRole: "participant" | "venue" | "staff" | "mapper";
    note?: string;
  },
): AccessApproachCandidate {
  if (candidate.disclosure === "private" && input.decision === "confirmed") {
    return {
      ...candidate,
      status: "rejected",
      reviewer: input.reviewer,
      evidence: [
        ...candidate.evidence,
        "Private-home approach candidates cannot be publicly confirmed.",
      ],
    };
  }

  let status = decisionToStatus(input.decision);
  if (input.decision === "confirmed") {
    if (input.reviewerRole === "participant") status = "participant_confirmed";
    else if (input.reviewerRole === "venue") status = "venue_confirmed";
    else status = "staff_confirmed";
  }

  return {
    ...candidate,
    status,
    reviewer: input.reviewer,
    evidence: input.note ? [...candidate.evidence, input.note] : candidate.evidence,
  };
}

/** Public listing filter — never includes private homes or inferred-as-accessible. */
export function filterPublishableApproachCandidates(
  candidates: AccessApproachCandidate[],
): AccessApproachCandidate[] {
  return candidates.filter(
    (c) =>
      c.disclosure !== "private" &&
      (c.status === "participant_confirmed" ||
        c.status === "staff_confirmed" ||
        c.status === "source_verified"),
  );
}
