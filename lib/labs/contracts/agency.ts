export const AGENCY_ACTORS = [
  "PARTICIPANT",
  "SYSTEM",
  "ENVIRONMENT",
  "SUPPORT_PERSON",
] as const;

export type AgencyActor = (typeof AGENCY_ACTORS)[number];

export const AUTHORITY_STATES = [
  "PARTICIPANT_HOLDS",
  "SYSTEM_PROPOSES",
  "SYSTEM_CONTINUES_ROUTINE",
  "AWAITING_PARTICIPANT",
  "HANDED_BACK",
] as const;

export type AuthorityState = (typeof AUTHORITY_STATES)[number];

export type AgencyEvent = {
  id: string;
  actor: AgencyActor;
  action: string;
  authorityState: AuthorityState;
  participantChoiceId?: string;
  scenarioNodeId?: string;
  timestamp: string;
  labsSimulationData: true;
};

export type ParticipantChoice = {
  id: string;
  decisionPointId: string;
  optionId: string;
  label: string;
  autonomyMode: string;
  timestamp: string;
};

export type DecisionOption = {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
};

export type DecisionPoint = {
  id: string;
  nodeId: string;
  eventType: string;
  prompt: string;
  options: DecisionOption[];
  systemRecommendationId?: string;
};
