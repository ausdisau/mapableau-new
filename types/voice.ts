export type VoiceDraftType =
  | "care_request"
  | "transport_trip"
  | "care_transport_bundle"
  | "provider_message"
  | "service_log"
  | "incident_draft"
  | "search_query";

export type VoiceAdapterKind =
  | "mock"
  | "speaches"
  | "faster_whisper"
  | "whisper_cpp"
  | "vosk";

export type VoiceSessionStatus =
  | "created"
  | "recording"
  | "transcribing"
  | "review"
  | "completed"
  | "discarded"
  | "error";

export type VoiceTranscriptStatus =
  | "pending_review"
  | "confirmed"
  | "discarded";

export type VoiceIntentDraftStatus = "draft" | "applied" | "discarded";

export type VoiceAudioRetention = "ephemeral" | "consented_storage";

export type VoiceTranscriptionResult = {
  adapter: VoiceAdapterKind;
  text: string;
  confidence: number;
  language: string;
  segments?: { start: number; end: number; text: string }[];
  metadata?: Record<string, unknown>;
};

export type VoiceSession = {
  id: string;
  userId: string;
  organisationId: string | null;
  intendedDraftType: VoiceDraftType;
  status: VoiceSessionStatus;
  adapterUsed: VoiceAdapterKind | null;
  audioRetention: VoiceAudioRetention;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VoiceTranscript = {
  id: string;
  sessionId: string;
  rawTranscript: string;
  editedTranscript: string | null;
  confidence: number | null;
  language: string | null;
  status: VoiceTranscriptStatus;
  createdAt: string;
  updatedAt: string;
};

export type VoiceIntentDraft = {
  id: string;
  transcriptId: string;
  draftType: VoiceDraftType;
  draftPayloadJson: Record<string, unknown>;
  status: VoiceIntentDraftStatus;
  createdAt: string;
};

export const VOICE_DRAFT_TYPE_LABELS: Record<VoiceDraftType, string> = {
  care_request: "Care request",
  transport_trip: "Transport trip",
  care_transport_bundle: "Care and transport",
  provider_message: "Message to provider",
  service_log: "Service log",
  incident_draft: "Incident report draft",
  search_query: "Search",
};
