/**
 * Participant Agency Memory — governed long-term preferences and decisions.
 * Only explicitly supplied or confirmed items persist. No psychological models.
 */

/** Governed memory categories only. */
export const AGENCY_MEMORY_CATEGORIES = [
  "communication",
  "access",
  "care",
  "transport",
  "jobs",
  "provider_preference",
  "provider_exclusion",
  "privacy",
  "disclosure",
  "interaction",
  "mission_preference",
] as const;

export type AgencyMemoryCategory = (typeof AGENCY_MEMORY_CATEGORIES)[number];

/**
 * Prohibited inference / profiling categories — never persist.
 * Enforced at write boundaries.
 */
export const PROHIBITED_MEMORY_CATEGORIES = [
  "compliance",
  "motivation",
  "personality",
  "loneliness",
  "capacity",
  "intelligence",
  "risk_tolerance",
  "emotional_instability",
  "credibility",
  "deservingness",
  "inferred_capacity",
  "inferred_preference",
  "behavioural_score",
  "psychological_profile",
] as const;

export type ProhibitedMemoryCategory =
  (typeof PROHIBITED_MEMORY_CATEGORIES)[number];

export const MEMORY_CONFIRMATION_STATES = [
  "proposed",
  "confirmed",
  "superseded",
  "revoked",
  "expired",
] as const;

export type MemoryConfirmationState =
  (typeof MEMORY_CONFIRMATION_STATES)[number];

/** Only confirmed memory may affect mission personalisation. */
export const MEMORY_SOURCES = [
  "participant_explicit",
  "participant_confirmed",
  "delegate_proposed",
  "system_proposed",
  "model_proposed",
] as const;

export type MemorySource = (typeof MEMORY_SOURCES)[number];

/** Sources that may never auto-confirm. */
export const NON_CONFIRMING_SOURCES: MemorySource[] = [
  "delegate_proposed",
  "system_proposed",
  "model_proposed",
];

export const MEMORY_VISIBILITY = [
  "participant_only",
  "participant_and_authorised_delegate",
  "mission_scoped",
] as const;

export type MemoryVisibility = (typeof MEMORY_VISIBILITY)[number];

export const PREFERENCE_GRAPH_EDGE_TYPES = [
  "HAS_PREFERENCE",
  "EXCLUDES",
  "PREFERS",
  "CHOOSES",
  "PURSUES",
] as const;

export type PreferenceGraphEdgeType =
  (typeof PREFERENCE_GRAPH_EDGE_TYPES)[number];

export type AgencyMemoryEvidenceRef = {
  entityType: string;
  entityId: string;
  label?: string;
};

export type AgencyMemoryDelegateMeta = {
  delegateId: string;
  authorityDomain: string;
  /** Family/support opinion is never treated as participant preference by default. */
  requiresParticipantConfirmation: boolean;
  suppliedAs: "delegate_opinion" | "delegate_authorised_write";
};

export type MapAbleAgencyMemoryItem = {
  memoryId: string;
  participantId: string;
  /** Tenant / organisation isolation key — cross-tenant access forbidden. */
  tenantId: string;
  category: AgencyMemoryCategory;
  statement: string;
  structuredValue?: unknown;
  source: MemorySource;
  confirmationState: MemoryConfirmationState;
  confirmedAt?: string;
  effectiveFrom: string;
  expiresAt?: string;
  consentScopes: string[];
  visibility: MemoryVisibility;
  editable: boolean;
  deletable: boolean;
  version: number;
  supersedes?: string;
  evidenceRefs: AgencyMemoryEvidenceRef[];
  /** Purpose binding — e.g. jobs disclosure must stay purpose-specific. */
  purpose?: string;
  delegate?: AgencyMemoryDelegateMeta;
  createdAt: string;
  updatedAt: string;
  /** Soft-delete marker; item removed from active use but audit version retained. */
  deletedAt?: string;
  /** Participant-corrected provenance note. */
  provenanceCorrection?: string;
};

export type PreferenceGraphNode = {
  nodeId: string;
  kind: "participant" | "memory" | "target";
  label: string;
  memoryId?: string;
  participantId?: string;
};

export type PreferenceGraphEdge = {
  edgeId: string;
  type: PreferenceGraphEdgeType;
  fromNodeId: string;
  toNodeId: string;
  memoryId: string;
  participantId: string;
  tenantId: string;
  /** Edges are only materialised for confirmed memory. */
  active: boolean;
  createdAt: string;
  explicit: true;
};

export type PreferenceGraph = {
  participantId: string;
  tenantId: string;
  nodes: PreferenceGraphNode[];
  edges: PreferenceGraphEdge[];
};

export type MemoryConflict = {
  conflictId: string;
  participantId: string;
  category: AgencyMemoryCategory;
  memoryIds: string[];
  reason: string;
  resolution: "ask_participant" | "most_recent_supersedes" | "unresolved";
  explanation: string;
};

export type AgencyMemoryControls = {
  participantId: string;
  personalisationPaused: boolean;
  aiUseDisabled: boolean;
  updatedAt: string;
};

export type AgencyMemoryScopedQuery = {
  participantId: string;
  tenantId: string;
  categories?: AgencyMemoryCategory[];
  purposes?: string[];
  consentScopes?: string[];
  missionId?: string;
  maxItems?: number;
};

export type AgencyMemoryExportBundle = {
  exportedAt: string;
  participantId: string;
  format: "structured_json" | "human_readable";
  items: MapAbleAgencyMemoryItem[];
  graph: PreferenceGraph;
  humanReadable: string;
  note: string;
};
