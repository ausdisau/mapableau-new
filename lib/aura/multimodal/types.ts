export type AuraMultimodalInput = {
  missionId?: string;
  text?: string;
  audio?: {
    localReference: string;
    durationSeconds?: number;
    retained: boolean;
  };
  images?: {
    localReference: string;
    retained: boolean;
    locationMetadataIncluded: boolean;
  }[];
  participantSelections?: {
    selectedElementId?: string;
    selectedRequirementIds?: string[];
    selectedMapLocation?: {
      latitude: number;
      longitude: number;
      precision: "exact" | "reduced";
    };
  };
  requestedPurpose:
    | "ask_question"
    | "identify_place_element"
    | "record_observation"
    | "describe_image"
    | "create_route_note"
    | "prepare_correction";
  processingPreference:
    | "local_only"
    | "local_preferred"
    | "cloud_allowed"
    | "no_ai";
  createdAt: string;
};

export type AuraMediaState =
  | "captured"
  | "processing_local"
  | "processing_cloud_approved"
  | "candidate_ready"
  | "accepted_as_draft"
  | "rejected"
  | "expired"
  | "deleted";

export type AuraMediaDraft = {
  id: string;
  missionId?: string;
  userId: string;
  localReference: string;
  mediaType: "image" | "audio";
  state: AuraMediaState;
  retained: boolean;
  locationMetadataIncluded: boolean;
  exifStripped: boolean;
  expiresAt: string;
  createdAt: string;
};

export type AuraPerceptionCandidate = {
  id: string;
  missionId?: string;
  candidateType: string;
  label: string;
  description: string;
  confidence: number;
  source:
    | "local_on_device"
    | "cloud_model"
    | "deterministic_fixture"
    | "participant_marked";
  mediaReference?: string;
  boundingRegion?: { x: number; y: number; width: number; height: number };
  exactMeasurementAvailable: false;
  requiresHumanConfirmation: true;
  state: "candidate" | "accepted_as_observation_draft" | "rejected" | "expired";
  createdAt: string;
};

export const PERCEPTION_CANDIDATE_TYPES = [
  "entrance",
  "doorway",
  "step",
  "ramp",
  "lift_sign",
  "toilet_sign",
  "obstruction",
  "corridor",
  "service_counter",
  "seating",
  "quiet_space_sign",
  "hearing_loop_sign",
  "visual_display",
  "curb_ramp",
  "passenger_loading_zone",
] as const;
