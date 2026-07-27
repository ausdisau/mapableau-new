/** AURA Journey World Model — Wave 7 types (slim slice). */

export type AuraJourneyWorldNodeType =
  | "origin"
  | "appointment"
  | "transport_service"
  | "stop"
  | "station"
  | "station_entrance"
  | "station_pathway"
  | "platform"
  | "vehicle"
  | "curb_zone"
  | "venue"
  | "entrance"
  | "venue_entrance"
  | "lift"
  | "corridor"
  | "destination"
  | "unknown"
  | "fallback";

export type AuraJourneyWorldEdgeType =
  | "requires"
  | "connects_to"
  | "boards_at"
  | "alights_at"
  | "travels_via"
  | "enters_via"
  | "navigates_via"
  | "depends_on"
  | "blocked_by"
  | "made_uncertain_by"
  | "alternative_to";

export type AuraSourceVersionReference = {
  sourceId: string;
  version: string;
  retrievedAt: string;
  trustState: "approved" | "pilot" | "quarantined" | "disabled";
};

export type AuraJourneyWorldNode = {
  id: string;
  type: AuraJourneyWorldNodeType;
  label: string;
  canonicalId?: string;
  sourceId?: string;
  status: "ok" | "blocked" | "unknown" | "uncertain";
  provenance?: AuraSourceVersionReference;
};

export type AuraJourneyWorldEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: AuraJourneyWorldEdgeType;
  label?: string;
  verified: boolean;
  sourceId?: string;
};

export type AuraJourneyWorld = {
  id: string;
  missionId: string;
  version: number;
  participantContextReference: string;
  passportReference: string;
  nodes: AuraJourneyWorldNode[];
  edges: AuraJourneyWorldEdge[];
  sourceVersions: AuraSourceVersionReference[];
  generatedAt: string;
  validUntil?: string;
};
