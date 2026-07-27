export type AuraJourneyGuardianState =
  | "inactive"
  | "scheduled"
  | "monitoring"
  | "change_detected"
  | "recalculating"
  | "alternative_available"
  | "no_verified_alternative"
  | "awaiting_participant_review"
  | "participant_declined"
  | "proposal_created"
  | "resolved"
  | "expired"
  | "stopped";

export type AuraJourneyGuardianAlert = {
  id: string;
  missionId: string;
  severity: "information" | "attention" | "urgent";
  changeType: string;
  summary: string;
  sourceReferences: string[];
  observedAt: string;
  receivedAt: string;
  previousPlanId: string;
  revisedPlanId?: string;
  effects: {
    routeChanged: boolean;
    statusChanged: boolean;
    arrivalTimeChanged: boolean;
    supportConflictCreated: boolean;
    newBlockers: string[];
    newUnknowns: string[];
  };
  alternative?: {
    label: string;
    verified: boolean;
    additionalMinutes?: number;
    additionalDistanceMetres?: number;
  };
  participantReviewRequired: boolean;
  actionProposalAvailable: boolean;
  venueVerificationRequestId?: string;
  expiresAt: string;
};

export type AuraJourneyGuardian = {
  id: string;
  missionId: string;
  userId: string;
  state: AuraJourneyGuardianState;
  urgency: "information" | "attention" | "urgent";
  monitoringExpiresAt: string;
  createdAt: string;
  stoppedAt?: string;
};
