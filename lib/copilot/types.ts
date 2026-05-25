import type { ConsentScope, DraftPrmsRecord } from "@/lib/prms/types";

export type CopilotIntentType =
  | "support"
  | "transport"
  | "combined"
  | "jobs"
  | "places"
  | "ndis"
  | "billing"
  | "incident"
  | "health"
  | "unknown";

export type CopilotMode =
  | "All"
  | "Support"
  | "Transport"
  | "Places"
  | "Jobs"
  | "Help"
  | "NDIS";

export type CopilotIntent = {
  type: CopilotIntentType;
  confidence: number;
  filters: Record<string, unknown>;
  reason: string;
};

export type CopilotActionType =
  | "CREATE_DRAFT_SERVICE_EVENT"
  | "CHECK_CONSENT"
  | "CHECK_NDIS_PLAN"
  | "INVOICE_REVIEW"
  | "EVIDENCE_PACK_REVIEW"
  | "PLAN_SUMMARY"
  | "BUDGET_EXPLANATION"
  | "INCIDENT_REPORT"
  | "SAFETY_ESCALATION"
  | "EMPLOYMENT_SUPPORT"
  | "GUIDANCE_ONLY";

export type CopilotAction = {
  type: CopilotActionType;
  label: string;
  requiresConfirmation: boolean;
};

export type ConfirmationGateType =
  | "PARTICIPANT_CONFIRMATION"
  | "CONSENT_CONFIRMATION"
  | "HUMAN_REVIEW_IF_FLAGGED"
  | "FINANCE_REVIEW"
  | "SAFETY_REVIEW"
  | "HUMAN_APPROVAL";

export type ConfirmationGate = {
  type: ConfirmationGateType;
  title: string;
  explanation: string;
};

export type CopilotWarningLevel = "info" | "warning" | "urgent";

export type CopilotWarning = {
  level: CopilotWarningLevel;
  message: string;
};

export type CopilotRequest = {
  query: string;
  mode?: CopilotMode | string;
  participantId?: string;
  sessionId?: string;
};

export type CopilotContext = {
  participantId: string;
  profileCompletionPercent: number;
  accessNeeds: { id: string; label: string }[];
  mobilityAids: { id: string; label: string }[];
  communicationPreferences: { id: string; mode: string }[];
  planSummary: {
    status: string;
    fundingManagement: string;
    overallBudgetBand: string;
  };
  activeGoals: { id: string; summary: string }[];
  consentSummary: {
    grantedScopes: ConsentScope[];
    openConsentConflicts: ConsentScope[];
  };
  upcomingEvents: { id: string; title: string; scheduledAt: string }[];
  openRisks: { id: string; level: string; label: string }[];
  missingEvidence: string[];
};

export type CopilotPlanningInput = {
  query: string;
  mode: string;
  intent: CopilotIntent;
  context: CopilotContext | null;
  sessionId: string;
  participantId?: string;
};

export type CopilotActionPlan = {
  summary: string;
  plainLanguageAnswer: string;
  filters: Record<string, unknown>;
  actions: CopilotAction[];
  draftRecords: DraftPrmsRecord[];
  requiredConfirmations: ConfirmationGate[];
  warnings: CopilotWarning[];
};

export type GuardrailInput = {
  planned: CopilotActionPlan;
  context: CopilotContext | null;
  participantId?: string;
};

export type CopilotAskResponse = {
  source: "mapable-copilot";
  intent: CopilotIntentType;
  confidence: number;
  summary: string;
  answer: string;
  filters: Record<string, unknown>;
  actions: CopilotAction[];
  draftRecords: DraftPrmsRecord[];
  requiredConfirmations: ConfirmationGate[];
  warnings: CopilotWarning[];
  blockedActions: CopilotAction[];
  /** Legacy-compatible fields for existing UI consumers */
  results?: unknown[];
  suggestedPrompts?: string[];
  /** Graph intelligence layer sync when participant is signed in */
  graphSync?: {
    goals: Array<{ key: string; label: string }>;
    supportNeeds: Array<{ key: string; label: string }>;
    checkpointRequired: boolean;
  };
};
