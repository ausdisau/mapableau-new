import { z } from "zod";

const graphTypeSchema = z.enum([
  "participant_journey",
  "support_journey",
  "booking",
  "outcome",
  "consent",
  "guardrail",
  "feedback",
  "provider_capability",
  "assessment_evidence",
]);

const nodeTypeSchema = z.string().min(1).max(64);
const edgeTypeSchema = z.string().min(1).max(64);

export const createGraphNodeSchema = z.object({
  graphType: graphTypeSchema,
  nodeType: nodeTypeSchema,
  entityId: z.string().optional(),
  participantId: z.string().optional(),
  label: z.string().min(1).max(500),
  status: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string().optional(),
});

export const updateGraphNodeSchema = z.object({
  label: z.string().min(1).max(500).optional(),
  status: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const createGraphEdgeSchema = z.object({
  graphType: graphTypeSchema,
  edgeType: edgeTypeSchema,
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  participantId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  weight: z.number().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string().optional(),
});

export const participantJourneyActionSchema = z.object({
  participantId: z.string().min(1),
  action: z.enum([
    "create",
    "add_goal",
    "add_preference",
    "add_functional_signal",
    "add_environmental_barrier",
    "confirm",
    "correct",
  ]),
  label: z.string().optional(),
  key: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  nodeId: z.string().uuid().optional(),
  actorId: z.string().optional(),
});

export const supportJourneyActionSchema = z.object({
  participantId: z.string().min(1),
  action: z.enum([
    "create",
    "infer_from_query",
    "confirm_need",
    "reject_need",
    "generate_recommendation",
    "create_service_plan",
    "review",
  ]),
  query: z.string().max(2000).optional(),
  supportNeedKey: z.string().optional(),
  label: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  actorId: z.string().optional(),
});

export const bookingGraphActionSchema = z.object({
  participantId: z.string().min(1),
  sessionId: z.string().optional(),
  action: z.enum([
    "create_session",
    "add_care_draft",
    "add_transport_draft",
    "add_employment_event",
    "link_dependency",
    "validate",
    "confirm",
    "fail",
    "timing_issue",
  ]),
  careBookingId: z.string().optional(),
  transportBookingId: z.string().optional(),
  employmentEventId: z.string().optional(),
  fromNodeId: z.string().uuid().optional(),
  toNodeId: z.string().uuid().optional(),
  scheduledAt: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const outcomeGraphActionSchema = z.object({
  participantId: z.string().min(1),
  outcomeType: z.string().min(1),
  label: z.string().min(1),
  goalNodeId: z.string().uuid().optional(),
  bookingNodeId: z.string().uuid().optional(),
  feedback: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const consentCheckSchema = z.object({
  participantId: z.string().min(1),
  scope: z.enum([
    "share_access_needs_with_driver",
    "share_support_profile_with_provider",
    "share_assessment_summary_with_coordinator",
    "use_feedback_for_personalisation",
    "use_deidentified_data_for_research",
  ]),
  recipientId: z.string().optional(),
  recipientType: z.enum(["user", "organisation", "driver", "provider"]).optional(),
  mode: z.enum(["once", "always", "deny"]).optional(),
});

export const guardrailEvaluateSchema = z.object({
  participantId: z.string().min(1),
  action: z.string().min(1).max(200),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const feedbackGraphActionSchema = z.object({
  participantId: z.string().min(1),
  feedbackType: z.enum([
    "confirmation",
    "edit",
    "rejection",
    "override",
    "complaint",
    "learning_signal",
  ]),
  targetNodeId: z.string().uuid().optional(),
  message: z.string().max(2000).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  actorId: z.string().optional(),
});

export const assessmentEvidenceActionSchema = z.object({
  participantId: z.string().min(1),
  action: z.enum([
    "add_tool",
    "add_result",
    "link_to_signal",
    "link_signal_to_need",
    "add_document",
    "add_narrative",
  ]),
  tool: z.string().optional(),
  label: z.string().optional(),
  resultData: z.record(z.string(), z.unknown()).optional(),
  documentRef: z.string().optional(),
  narrative: z.string().max(5000).optional(),
  nodeId: z.string().uuid().optional(),
});

export const graphEventSchema = z.object({
  graphType: graphTypeSchema,
  participantId: z.string().optional(),
  eventType: z.string().min(1),
  relatedNodeId: z.string().uuid().optional(),
  relatedEdgeId: z.string().uuid().optional(),
  actorType: z.string().optional(),
  actorId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const llmGraphSyncSchema = z.object({
  participantId: z.string().min(1),
  query: z.string().min(1).max(2000),
  actorId: z.string().optional(),
});
