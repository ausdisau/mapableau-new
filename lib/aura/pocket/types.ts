/** AURA Pocket — Wave 6 types */

export type AuraPocketCapability =
  | "offline_mission"
  | "offline_visit_pack"
  | "local_plain_language"
  | "local_text_rewrite"
  | "local_summarisation"
  | "local_speech_recognition"
  | "local_image_description"
  | "local_multimodal_prompt"
  | "camera_capture"
  | "spatial_capture"
  | "symbol_rendering"
  | "text_to_speech"
  | "haptic_guidance"
  | "local_encrypted_storage"
  | "background_sync";

export type AuraPocketCapabilityState = {
  capability: AuraPocketCapability;
  state:
    | "available"
    | "available_with_limits"
    | "permission_required"
    | "not_supported"
    | "disabled_by_user"
    | "disabled_by_policy"
    | "not_configured";
  provider:
    | "deterministic"
    | "browser"
    | "android_on_device"
    | "ios_on_device"
    | "native_bridge"
    | "cloud"
    | "none";
  localProcessing: boolean;
  networkRequired: boolean;
  sensitiveInputAllowed: boolean;
  limitations: string[];
  checkedAt: string;
};

export type AuraInferenceMode =
  | "local_only"
  | "local_preferred"
  | "cloud_allowed"
  | "no_ai";

export type AuraInferenceSelection = {
  requestedMode: AuraInferenceMode;
  selectedProvider:
    | "deterministic"
    | "android_on_device"
    | "ios_on_device"
    | "browser_local"
    | "cloud"
    | "none";
  localProcessing: boolean;
  networkRequired: boolean;
  fallbackUsed: boolean;
  limitations: string[];
  consentRequired: boolean;
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
    | "observation_draft";
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
