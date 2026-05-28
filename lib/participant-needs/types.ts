import type { DraftPrmsRecord } from "@/lib/prms/types";

export type ParticipantNeedsDomain =
  | "mobility"
  | "communication"
  | "daily_living"
  | "transport"
  | "social_community"
  | "plan_goals"
  | "risks";

export type NeedsSignalSource =
  | "profile"
  | "accessibility"
  | "care_access_need"
  | "care_request"
  | "plan_summary"
  | "inferred";

export type NeedsSignal = {
  id: string;
  domain: ParticipantNeedsDomain;
  label: string;
  source: NeedsSignalSource;
  confidence: number;
};

export type NeedsGap = {
  domain: ParticipantNeedsDomain;
  reason: string;
  severity: "info" | "watch" | "urgent";
};

export type ParticipantNeedsSnapshot = {
  participantId: string;
  participantUserId: string;
  displayName: string | null;
  serviceRegion: string | null;
  signals: NeedsSignal[];
  gaps: NeedsGap[];
  profileCompletionPercent: number;
  profileCompletionHints: string[];
};

export type NeedsAssessmentStreamStage =
  | "received_query"
  | "loaded_profile"
  | "analysed_domains"
  | "identified_gaps"
  | "recommendations"
  | "finalized";

export type NeedsAssessmentStreamEvent = {
  stage: NeedsAssessmentStreamStage;
  message: string;
  payload?: Record<string, unknown>;
};

export type NeedsAssessmentRecommendation = {
  id: string;
  label: string;
  kind:
    | "update_accessibility"
    | "draft_care_request"
    | "check_consent"
    | "worker_search"
    | "save_assessment";
  href?: string;
};

export type NeedsAssessmentResult = {
  participantId: string;
  summary: string;
  snapshot: ParticipantNeedsSnapshot;
  recommendations: NeedsAssessmentRecommendation[];
  suggestedActions: string[];
  draftRecords: DraftPrmsRecord[];
  workerSearchQuery?: string;
};
