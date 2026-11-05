export const PERSONA_TURN_SCHEMA_VERSION = "vp-turn.v1" as const;

export type PersonaActionAuthority = "none";

export type PersonaEvidenceStatus =
  | "synthetic_fixture"
  | "unverified"
  | "missing"
  | "not_applicable";

export type PersonaResponseType =
  | "informational"
  | "clarification"
  | "draft_support_request"
  | "refusal"
  | "error"
  | "fallback";

export type PersonaSourceReference = {
  id: string;
  label: string;
  evidenceStatus: PersonaEvidenceStatus;
  /** Never present live participant record URLs in P02 fixtures. */
  href?: string;
};

export type PersonaEditableDraft = {
  title: string;
  body: string;
  /** Explicitly non-executable in P02 */
  executable: false;
};

export type PersonaTurn = {
  schemaVersion: typeof PERSONA_TURN_SCHEMA_VERSION;
  turnId: string;
  responseType: PersonaResponseType;
  displayText: string;
  sourceReferences: PersonaSourceReference[];
  evidenceStatus: PersonaEvidenceStatus;
  uncertainties: string[];
  suggestedQuestions: string[];
  editableDraft: PersonaEditableDraft | null;
  requiresHumanReview: boolean;
  actionAuthority: PersonaActionAuthority;
  canUseNonAiFallback: boolean;
};

export type PersonaConversationState =
  | "idle"
  | "composing"
  | "processing"
  | "response_ready"
  | "draft_editing"
  | "needs_clarification"
  | "stopped"
  | "error"
  | "fallback_available";

export type PersonaSpeaker = "participant" | "persona" | "system";

export type PersonaHistoryItem = {
  id: string;
  speaker: PersonaSpeaker;
  text: string;
  turn?: PersonaTurn;
  createdAt: string;
};

export type PersonaReadingComplexity = "plain" | "standard" | "detailed";

export type PersonaPresentationPrefs = {
  readingComplexity: PersonaReadingComplexity;
  responseLength: "short" | "medium";
  useAiAssistance: boolean;
};

export type PersonaDenialReason =
  | "flag_disabled"
  | "ai_assistance_opt_out"
  | "stopped"
  | "invalid_response"
  | "adapter_unavailable"
  | "prohibited_action"
  | "empty_message";
