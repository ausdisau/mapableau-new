export type GraphType =
  | "participant_journey"
  | "support_journey"
  | "booking"
  | "outcome"
  | "consent"
  | "guardrail"
  | "feedback"
  | "provider_capability"
  | "assessment_evidence";

export type NodeType =
  | "Participant"
  | "Goal"
  | "Preference"
  | "FunctionalSignal"
  | "EnvironmentalBarrier"
  | "SupportNeed"
  | "AssessmentResult"
  | "AssessmentTool"
  | "Recommendation"
  | "ServicePlan"
  | "CareService"
  | "TransportService"
  | "EmploymentService"
  | "CareBooking"
  | "TransportBooking"
  | "EmploymentEvent"
  | "Provider"
  | "Worker"
  | "Credential"
  | "Availability"
  | "Capability"
  | "ConsentRecord"
  | "DataScope"
  | "DataRecipient"
  | "GuardrailRule"
  | "PolicyDecision"
  | "RiskSignal"
  | "Checkpoint"
  | "AuditEvidence"
  | "Outcome"
  | "Feedback"
  | "Complaint"
  | "Incident"
  | "LearningSignal"
  | "DocumentEvidence";

export type EdgeType =
  | "EXPRESSES"
  | "CONFIRMED"
  | "REJECTED"
  | "CORRECTED"
  | "INDICATES"
  | "CONTRIBUTES_TO"
  | "CONSTRAINS"
  | "SUPPORTS_GOAL"
  | "ADDRESSES_NEED"
  | "RECOMMENDED_BECAUSE_OF"
  | "REQUIRES_CONSENT"
  | "SHARED_WITH"
  | "REVOKED_BY"
  | "GOVERNED_BY"
  | "TRIGGERED"
  | "BLOCKED_BY"
  | "ESCALATED_TO"
  | "REQUIRES_CHECKPOINT"
  | "LINKED_TO_BOOKING"
  | "DEPENDS_ON"
  | "DELIVERED_BY"
  | "ASSIGNED_TO"
  | "HAS_CREDENTIAL"
  | "HAS_CAPABILITY"
  | "RESULTED_IN"
  | "UPDATED_AFTER_FEEDBACK"
  | "MEASURED_BY"
  | "EVIDENCED_BY";

export type PolicyOutcome =
  | "ALLOW_AUTOMATION"
  | "ALLOW_DRAFT_ONLY"
  | "REQUIRE_PARTICIPANT_CONFIRMATION"
  | "REQUIRE_SCOPED_CONSENT"
  | "REQUIRE_HUMAN_REVIEW"
  | "REQUIRE_CREDENTIAL_AND_TRAINING_CHECK"
  | "ESCALATE_SAFEGUARDING"
  | "BLOCK";

export type RiskTier =
  | "tier_0"
  | "tier_1"
  | "tier_2"
  | "tier_3"
  | "tier_4";

export interface GraphNode<TData = Record<string, unknown>> {
  id: string;
  graphType: GraphType;
  nodeType: NodeType;
  entityId?: string;
  participantId?: string;
  label: string;
  status?: string;
  data: TData;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdge<TData = Record<string, unknown>> {
  id: string;
  graphType: GraphType;
  edgeType: EdgeType;
  fromNodeId: string;
  toNodeId: string;
  participantId?: string;
  confidence?: number;
  weight?: number;
  data: TData;
  createdAt: string;
}

export interface GraphEvent<TPayload = Record<string, unknown>> {
  id: string;
  graphType: GraphType;
  participantId?: string;
  eventType: string;
  relatedNodeId?: string;
  relatedEdgeId?: string;
  actorType?: string;
  actorId?: string;
  payload: TPayload;
  createdAt: string;
}

export interface GraphSnapshot {
  id: string;
  graphType: GraphType;
  participantId: string;
  snapshot: Record<string, unknown>;
  reason?: string;
  createdAt: string;
}

export interface GraphQueryResult {
  graphType: GraphType;
  participantId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  events?: GraphEvent[];
}

export type ParticipantJourneyGraph = GraphQueryResult & {
  graphType: "participant_journey";
};

export type SupportJourneyGraph = GraphQueryResult & {
  graphType: "support_journey";
};

export type BookingGraph = GraphQueryResult & {
  graphType: "booking";
};

export type OutcomeGraph = GraphQueryResult & {
  graphType: "outcome";
};

export type ConsentGraph = GraphQueryResult & {
  graphType: "consent";
};

export type GuardrailGraph = GraphQueryResult & {
  graphType: "guardrail";
};

export type FeedbackGraph = GraphQueryResult & {
  graphType: "feedback";
};

export type ProviderCapabilityGraph = GraphQueryResult & {
  graphType: "provider_capability";
};

export type AssessmentEvidenceGraph = GraphQueryResult & {
  graphType: "assessment_evidence";
};

export interface SupportClassificationOutput {
  goals: Array<{ key: string; label: string }>;
  supportNeeds: Array<{ key: string; label: string }>;
  accessNeeds: string[];
  missingInformation: string[];
  riskFlags: Array<{ tier: RiskTier; reason: string }>;
  sensorySignals?: string[];
}

export interface GuardrailEvaluationResult {
  outcome: PolicyOutcome;
  riskTier: RiskTier;
  explanation: string;
  checkpointRequired: boolean;
  ruleIds: string[];
}

export interface CPSimGraphInput {
  participantId: string;
  supportNeeds: string[];
  bookings: Array<Record<string, unknown>>;
  assessmentSignals: string[];
  consentScopes: string[];
  providerCapabilities: string[];
}

export interface MDSimGraphInput {
  participantId: string;
  bookings: Array<Record<string, unknown>>;
  providerReliability: Array<Record<string, unknown>>;
  outcomes: Array<Record<string, unknown>>;
  feedbackSignals: Array<Record<string, unknown>>;
  guardrailDecisions: Array<Record<string, unknown>>;
}
