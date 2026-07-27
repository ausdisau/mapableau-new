/** AURA Pocket — Wave 6 types */

export type AuraPocketCapability =
  | "offline_mission"
  | "offline_visit_pack"
  | "local_plain_language"
  | "local_encrypted_storage"
  | "background_sync";

export type AuraPocketCapabilityState = {
  capability: AuraPocketCapability;
  state:
    | "available"
    | "available_with_limits"
    | "not_supported"
    | "disabled_by_user"
    | "disabled_by_policy";
  provider: "deterministic" | "browser" | "none";
  localProcessing: boolean;
  networkRequired: boolean;
  limitations: string[];
  checkedAt: string;
};

export type AuraPocketMissionSnapshot = {
  id: string;
  userIdHash: string;
  missionId: string;
  missionVersion: number;
  planArtifactId: string;
  planVersion: number;
  goal: string;
  missionState: string;
  place?: { id: string; name: string; address: string };
  destination?: string;
  visitAt?: string;
  route?: {
    entrance?: string;
    instructions: string[];
    fallbackInstructions?: string[];
  };
  knownFacts: string[];
  blockers: string[];
  conditions: string[];
  unknowns: string[];
  liveSnapshot?: {
    capturedAt: string;
    incidents: string[];
    staleAfter: string;
  };
  evidenceSummary: {
    label: string;
    sourceType: string;
    observedAt: string;
    confidence: number;
  }[];
  authorisedContacts: { label: string; value: string; purpose: string }[];
  presentationPreference: string;
  createdAt: string;
  staleAfter: string;
  expiresAt?: string;
  syncState:
    | "local_only"
    | "in_sync"
    | "local_changes"
    | "server_changes"
    | "conflict"
    | "deleted";
  stopped: boolean;
};

export type AuraOfflineSyncOperation = {
  id: string;
  userId: string;
  type:
    | "snapshot_upsert"
    | "stop_receipt"
    | "deletion"
    | "presentation_preference"
    | "observation_draft"
    | "execution_approval";
  payloadRef: string;
  idempotencyKey: string;
  createdAt: string;
  status: "pending" | "synced" | "conflict" | "rejected";
};

export type AuraPendingStopReceipt = {
  id: string;
  missionId: string;
  userId: string;
  requestedAt: string;
  syncedAt?: string;
  idempotencyKey: string;
};
