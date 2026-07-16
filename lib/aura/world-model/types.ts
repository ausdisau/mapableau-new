export type AuraJourneyWorldNodeType =
  | "origin"
  | "appointment"
  | "care_support"
  | "supporter"
  | "transport_service"
  | "transport_trip"
  | "stop"
  | "station"
  | "station_entrance"
  | "station_pathway"
  | "platform"
  | "vehicle"
  | "curb_zone"
  | "drop_off"
  | "external_path"
  | "venue"
  | "entrance"
  | "venue_entrance"
  | "lift"
  | "corridor"
  | "toilet"
  | "quiet_space"
  | "destination"
  | "incident"
  | "unknown"
  | "action_proposal"
  | "fallback";

export type AuraJourneyWorldEdgeType =
  | "requires"
  | "connects_to"
  | "boards_at"
  | "alights_at"
  | "transfers_to"
  | "travels_via"
  | "enters_via"
  | "navigates_via"
  | "depends_on"
  | "blocked_by"
  | "made_uncertain_by"
  | "alternative_to"
  | "verified_by"
  | "observed_by"
  | "requires_approval";

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
  liveStateSnapshotId?: string;
  generatedAt: string;
  validUntil?: string;
};
