import type {
  GeoscapeSourceReference,
  SpatialCandidateStatus,
  SpatialConfidenceVocabulary,
} from "@/lib/spatial/types";

/** Approach / drop-off candidate kinds — never auto-published as accessible. */
export type AccessApproachCandidateType =
  | "pedestrian_entrance"
  | "step_free_entrance"
  | "assisted_entrance"
  | "vehicle_entrance"
  | "loading_entrance"
  | "accessible_parking_entrance"
  | "drop_off_point"
  | "pickup_point"
  | "equipment_delivery_entrance"
  | "staff_assistance_point";

export type AccessApproachCandidate = {
  candidateId: string;
  placeId?: string;
  placeLabel: string;
  formattedAddress?: string;
  buildingLabel?: string;
  candidateType: AccessApproachCandidateType;
  latitude?: number;
  longitude?: number;
  source: GeoscapeSourceReference | { kind: "mapable_synthetic" | "access_place" | "participant_report" | "venue_evidence"; label: string };
  evidence: string[];
  accessibleCharacteristics: string[];
  status: SpatialCandidateStatus;
  confidence: SpatialConfidenceVocabulary;
  reviewer?: string;
  expiresAt?: string;
  /** Private homes must never be publicly listed. */
  disclosure: "private" | "organisation" | "public_candidate";
};

export type AccessApproachReviewDecision =
  | "confirmed"
  | "rejected"
  | "needs_more_evidence";
