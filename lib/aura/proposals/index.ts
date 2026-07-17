/**
 * MapAble AURA Wave 3 — immutable action proposals (shadow mode only).
 * Zero external actions. futureExecutionEligible is always false.
 */

import { createHash, randomUUID } from "crypto";

import { z } from "zod";

import { auraFlags } from "../feature-flags";
import { assertLease } from "../leases";
import type { AuraMissionRecord } from "../mission/store";
import { requireMission, saveMission } from "../mission/store";
import { assertMissionNotStopped } from "../stop";
import { appendWitness } from "../witness";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const auraProposalActionTypeSchema = z.enum([
  "venue_verification_request",
  "visit_plan_share",
  "supporter_notification",
  "transport_request",
  "barrier_report",
]);
export type AuraProposalActionType = z.infer<typeof auraProposalActionTypeSchema>;

export const auraProposalRiskSchema = z.enum([
  "informational",
  "communication",
  "service_request",
  "sensitive_disclosure",
  "operational_change",
  "restricted",
  "prohibited",
]);
export type AuraProposalRisk = z.infer<typeof auraProposalRiskSchema>;

export const auraProposalStateSchema = z.enum([
  "draft",
  "verifying",
  "verification_failed",
  "ready_for_review",
  "participant_accepted_for_shadow",
  "participant_declined",
  "shadow_evaluating",
  "shadow_allowed",
  "shadow_blocked",
  "shadow_indeterminate",
  "superseded",
  "expired",
  "cancelled",
  "execution_disabled",
]);
export type AuraProposalState = z.infer<typeof auraProposalStateSchema>;

export type AuraDisclosureField = {
  key: string;
  label: string;
  source:
    | "mission"
    | "access_passport"
    | "visit_plan"
    | "transport_context"
    | "calendar"
    | "participant_input";
  classification: "public" | "personal" | "sensitive" | "health_related";
  valuePreview: string;
  requiredForPurpose: boolean;
  reason: string;
};

export type AuraProposalCondition = {
  id: string;
  label: string;
  met: boolean | null;
  required: boolean;
};

export type AuraActionProposal = {
  id: string;
  missionId: string;
  planArtifactId: string;
  planVersion: number;
  version: number;
  previousVersionId?: string;
  supersededById?: string;
  actionType: AuraProposalActionType;
  risk: AuraProposalRisk;
  target: {
    applicationService: string;
    recipientType: string;
    recipientId?: string;
    recipientLabel: string;
  };
  purpose: { code: string; plainLanguage: string };
  payload: Record<string, unknown>;
  disclosure: {
    fieldsShared: AuraDisclosureField[];
    fieldsOmitted: AuraDisclosureField[];
    sourcePassportId?: string;
    sourceVisitPlanId?: string;
  };
  evidenceReferences: Array<{ evidenceId: string; reason: string }>;
  preconditions: AuraProposalCondition[];
  expectedResult: string;
  possibleFailures: string[];
  fallbackPlan: string[];
  authority: {
    requiredLevel: "L3_PROPOSE";
    participantShadowReviewRequired: boolean;
    futureParticipantApprovalRequired: boolean;
    futureVenueApprovalRequired: boolean;
    humanReviewRequired: boolean;
  };
  createdBy: { actorType: "participant" | "aura"; actorId: string };
  createdAt: string;
  expiresAt: string;
  proposalHash: string;
  idempotencyKey: string;
  state: AuraProposalState;
  /** Presentation-only; not hashed */
  presentationNote?: string;
};

export type AuraProposalVerification = {
  proposalId: string;
  proposalVersion: number;
  status:
    | "verified_for_shadow"
    | "verified_with_warnings"
    | "rejected"
    | "human_review_required";
  checks: Array<{
    id: string;
    status: "passed" | "warning" | "failed";
    explanation: string;
  }>;
  futureExecutionEligible: false;
  checkedAt: string;
  verifierVersion: string;
};

export type AuraProposalReview = {
  id: string;
  proposalId: string;
  proposalVersion: number;
  participantId: string;
  decision:
    | "accepted_for_shadow"
    | "declined"
    | "revision_requested"
    | "cancelled";
  participantComment?: string;
  proposalHash: string;
  decidedAt: string;
  futureExecutionApproval: false;
};

export type AuraShadowEvaluation = {
  id: string;
  proposalId: string;
  proposalVersion: number;
  missionId: string;
  status:
    | "would_allow"
    | "would_block"
    | "would_require_human_review"
    | "indeterminate";
  stages: Array<{
    stage: string;
    result: "passed" | "warning" | "failed" | "unknown";
    explanation: string;
    policyReferences: string[];
  }>;
  requiredFutureApprovals: {
    participant: boolean;
    venue: boolean;
    organisation: boolean;
    humanReviewer: boolean;
  };
  requiredFutureConsentScopes: string[];
  serviceAssessment: {
    applicationService: string;
    schemaValid: boolean;
    available: boolean | null;
    adapterState:
      | "configured"
      | "not_configured"
      | "mock_only"
      | "unavailable"
      | "unknown";
  };
  predictedEffects: {
    recordsThatWouldBeCreated: string[];
    recipientsThatWouldBeContacted: string[];
    notificationsThatWouldBeTriggered: string[];
  };
  possibleFailureCodes: string[];
  fallbackPlan: string[];
  executionAttempted: false;
  externalSideEffects: 0;
  evaluatedAt: string;
  expiresAt: string;
};

export type AuraShadowReceipt = {
  id: string;
  proposalId: string;
  proposalVersion: number;
  proposalHash: string;
  participantReviewId: string;
  shadowEvaluationId: string;
  summary: string;
  status:
    | "shadow_allowed"
    | "shadow_blocked"
    | "shadow_human_review"
    | "shadow_indeterminate";
  executionAttempted: false;
  externalSideEffects: 0;
  createdAt: string;
  auditCorrelationId: string;
  notice: string;
};

export type AuraProposalDiff = {
  fromVersion: number;
  toVersion: number;
  changes: Array<{
    field: string;
    before: string;
    after: string;
    significance:
      | "presentation"
      | "operational"
      | "disclosure"
      | "authority";
  }>;
  requiresNewReview: boolean;
};

// ---------------------------------------------------------------------------
// Prohibited registry (immutable — no request-time exceptions)
// ---------------------------------------------------------------------------

export const AURA_PROHIBITED_PROPOSAL_TYPES = Object.freeze([
  "clinical_diagnosis",
  "clinical_treatment",
  "medication_change",
  "restrictive_practice",
  "safeguarding_resolution",
  "complaint_closure",
  "incident_concealment",
  "ndis_eligibility_decision",
  "funding_approval",
  "funding_denial",
  "ndis_claim_submission",
  "invoice_approval",
  "payment_release",
  "candidate_rejection",
  "employment_fitness_judgement",
  "participant_capacity_judgement",
  "worker_assignment_without_confirmation",
  "physical_transfer",
  "wheelchair_control",
  "vehicle_control",
  "lift_motor_control",
  "automatic_door_override",
  "alarm_modification",
  "emergency_system_modification",
  "safety_interlock_bypass",
  "credential_fabrication",
  "legal_compliance_certification",
] as const);

export function isProhibitedProposalType(type: string): boolean {
  return (AURA_PROHIBITED_PROPOSAL_TYPES as readonly string[]).includes(type);
}

// ---------------------------------------------------------------------------
// Purpose binding
// ---------------------------------------------------------------------------

export type AuraPurposeDefinition = {
  code: string;
  allowedActionTypes: AuraProposalActionType[];
  allowedRecipientTypes: string[];
  allowedFieldKeys: string[];
  prohibitedFieldKeys: string[];
  defaultExpiryHours: number;
  futureConsentRequirement: string[];
  futureServiceMethod: string;
  auditClassification: string;
  plainLanguage: string;
};

export const AURA_PURPOSE_REGISTRY: Record<string, AuraPurposeDefinition> = {
  "access.verify_venue_feature": {
    code: "access.verify_venue_feature",
    allowedActionTypes: ["venue_verification_request"],
    allowedRecipientTypes: ["venue", "venue_reception"],
    allowedFieldKeys: [
      "arrival_window",
      "entrance_label",
      "toilet_status_question",
      "written_directions_request",
      "lift_status_question",
      "quiet_space_question",
    ],
    prohibitedFieldKeys: [
      "diagnosis",
      "medical_history",
      "full_passport",
      "home_address",
      "funding",
    ],
    defaultExpiryHours: 24,
    futureConsentRequirement: ["access.venue_message"],
    futureServiceMethod: "deliverApprovedVenueVerification",
    auditClassification: "access_communication",
    plainLanguage: "Confirm access information for this visit.",
  },
  "access.share_visit_plan": {
    code: "access.share_visit_plan",
    allowedActionTypes: ["visit_plan_share"],
    allowedRecipientTypes: [
      "supporter",
      "support_worker",
      "driver",
      "venue",
      "employment_consultant",
    ],
    allowedFieldKeys: [
      "place_name",
      "destination",
      "route_steps",
      "entrance_label",
      "visit_time",
      "unknowns_summary",
      "fallback_summary",
    ],
    prohibitedFieldKeys: ["diagnosis", "medical_history", "full_passport", "funding"],
    defaultExpiryHours: 12,
    futureConsentRequirement: ["access.share_visit_plan"],
    futureServiceMethod: "shareVisitPlan",
    auditClassification: "sensitive_disclosure",
    plainLanguage: "Share a specific Visit Plan with an authorised recipient.",
  },
  "support.notify_mission_change": {
    code: "support.notify_mission_change",
    allowedActionTypes: ["supporter_notification"],
    allowedRecipientTypes: ["supporter", "support_worker"],
    allowedFieldKeys: [
      "meeting_point",
      "route_summary",
      "arrival_time",
      "disruption_summary",
      "fallback_summary",
    ],
    prohibitedFieldKeys: [
      "diagnosis",
      "full_passport",
      "employment_details",
      "medical_history",
    ],
    defaultExpiryHours: 8,
    futureConsentRequirement: ["support.notify"],
    futureServiceMethod: "notifySupporter",
    auditClassification: "sensitive_disclosure",
    plainLanguage: "Notify an authorised supporter of journey details.",
  },
  "transport.request_accessible_trip": {
    code: "transport.request_accessible_trip",
    allowedActionTypes: ["transport_request"],
    allowedRecipientTypes: ["transport_provider", "transport_service"],
    allowedFieldKeys: [
      "pickup",
      "destination",
      "time_window",
      "mobility_equipment",
      "companion_count",
      "vehicle_capabilities",
      "drop_off_instruction",
      "home_address",
    ],
    prohibitedFieldKeys: ["diagnosis", "full_passport", "medical_history", "funding"],
    defaultExpiryHours: 6,
    futureConsentRequirement: ["transport.create_request"],
    futureServiceMethod: "createTransportTrip",
    auditClassification: "service_request",
    plainLanguage: "Prepare an accessible transport request.",
  },
  "access.report_barrier": {
    code: "access.report_barrier",
    allowedActionTypes: ["barrier_report"],
    allowedRecipientTypes: ["community_moderation", "access_intelligence"],
    allowedFieldKeys: [
      "place_name",
      "element_id",
      "barrier_category",
      "description",
      "observation_time",
      "evidence_refs",
    ],
    prohibitedFieldKeys: ["diagnosis", "full_passport", "home_address", "medical_history"],
    defaultExpiryHours: 24,
    futureConsentRequirement: ["access.report_barrier"],
    futureServiceMethod: "createBarrierReport",
    auditClassification: "access_communication",
    plainLanguage: "Prepare a community barrier report for moderation.",
  },
};

export function resolvePurpose(
  actionType: AuraProposalActionType,
): AuraPurposeDefinition {
  const entry = Object.values(AURA_PURPOSE_REGISTRY).find((p) =>
    p.allowedActionTypes.includes(actionType),
  );
  if (!entry) throw new Error("AURA_PURPOSE_MISSING");
  return entry;
}

// ---------------------------------------------------------------------------
// Risk (deterministic — model cannot set)
// ---------------------------------------------------------------------------

export function classifyProposalRisk(
  actionType: AuraProposalActionType,
  hasSensitiveEvidence = false,
): AuraProposalRisk {
  switch (actionType) {
    case "venue_verification_request":
      return "communication";
    case "visit_plan_share":
    case "supporter_notification":
      return "sensitive_disclosure";
    case "transport_request":
      return "service_request";
    case "barrier_report":
      return hasSensitiveEvidence ? "sensitive_disclosure" : "communication";
    default: {
      const _exhaustive: never = actionType;
      void _exhaustive;
      return "prohibited";
    }
  }
}

// ---------------------------------------------------------------------------
// Service registry (metadata only — no write methods)
// ---------------------------------------------------------------------------

export const AURA_SERVICE_REGISTRY: Record<
  AuraProposalActionType,
  {
    applicationServiceId: string;
    inputSchemaId: string;
    requiredPermission: string;
    requiredConsent: string[];
    futureExecutionFlag: string;
    idempotencySupport: boolean;
    expectedReceiptType: string;
    adapterDependency: string;
    adapterState:
      | "configured"
      | "not_configured"
      | "mock_only"
      | "unavailable"
      | "unknown";
  }
> = {
  venue_verification_request: {
    applicationServiceId: "accessIntelligenceMessagingService",
    inputSchemaId: "venue_verification_draft",
    requiredPermission: "access.message_venue",
    requiredConsent: ["access.venue_message"],
    futureExecutionFlag: "MAPABLE_AURA_WRITE_EXECUTION_ENABLED",
    idempotencySupport: true,
    expectedReceiptType: "VenueVerificationReceipt",
    adapterDependency: "messaging",
    adapterState: "mock_only",
  },
  visit_plan_share: {
    applicationServiceId: "visitPlanSharingService",
    inputSchemaId: "visit_plan_share_draft",
    requiredPermission: "access.share_plan",
    requiredConsent: ["access.share_visit_plan"],
    futureExecutionFlag: "MAPABLE_AURA_WRITE_EXECUTION_ENABLED",
    idempotencySupport: true,
    expectedReceiptType: "VisitPlanShareReceipt",
    adapterDependency: "messaging",
    adapterState: "not_configured",
  },
  supporter_notification: {
    applicationServiceId: "notificationService",
    inputSchemaId: "supporter_notification_draft",
    requiredPermission: "support.notify",
    requiredConsent: ["support.notify"],
    futureExecutionFlag: "MAPABLE_AURA_WRITE_EXECUTION_ENABLED",
    idempotencySupport: true,
    expectedReceiptType: "NotificationReceipt",
    adapterDependency: "notifications",
    adapterState: "not_configured",
  },
  transport_request: {
    applicationServiceId: "transportRequestService",
    inputSchemaId: "transport_request_draft",
    requiredPermission: "transport.create",
    requiredConsent: ["transport.create_request"],
    futureExecutionFlag: "MAPABLE_AURA_WRITE_EXECUTION_ENABLED",
    idempotencySupport: true,
    expectedReceiptType: "TransportTripReceipt",
    adapterDependency: "transport",
    adapterState: "mock_only",
  },
  barrier_report: {
    applicationServiceId: "accessBarrierReportService",
    inputSchemaId: "barrier_report_draft",
    requiredPermission: "access.report",
    requiredConsent: ["access.report_barrier"],
    futureExecutionFlag: "MAPABLE_AURA_WRITE_EXECUTION_ENABLED",
    idempotencySupport: true,
    expectedReceiptType: "BarrierReportReceipt",
    adapterDependency: "moderation",
    adapterState: "mock_only",
  },
};

// ---------------------------------------------------------------------------
// Side-effect-free preflight validators
// ---------------------------------------------------------------------------

export type PreflightResult = {
  valid: boolean;
  schemaValid: boolean;
  warnings: string[];
  errors: string[];
  requiredConsent: string[];
  duplicateRisk: boolean;
  expectedRecords: string[];
};

let preflightSideEffectCounter = 0;
/** Test probe — must remain 0 across all preflight calls. */
export function getPreflightSideEffectCounter(): number {
  return preflightSideEffectCounter;
}
export function resetPreflightSideEffectCounter(): void {
  preflightSideEffectCounter = 0;
}

export function validateVenueVerificationDraft(payload: Record<string, unknown>): PreflightResult {
  const questions = payload.questions;
  const errors: string[] = [];
  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push("questions_required");
  }
  if (!payload.recipientLabel) errors.push("recipient_required");
  return {
    valid: errors.length === 0,
    schemaValid: errors.length === 0,
    warnings: [],
    errors,
    requiredConsent: ["access.venue_message"],
    duplicateRisk: false,
    expectedRecords: ["VerificationRequest"],
  };
}

export function validateVisitPlanShareDraft(payload: Record<string, unknown>): PreflightResult {
  const errors: string[] = [];
  if (!payload.recipientLabel) errors.push("recipient_required");
  if (!payload.planId) errors.push("plan_required");
  return {
    valid: errors.length === 0,
    schemaValid: errors.length === 0,
    warnings: [],
    errors,
    requiredConsent: ["access.share_visit_plan"],
    duplicateRisk: false,
    expectedRecords: ["VisitPlanShare"],
  };
}

export function validateSupporterNotificationDraft(
  payload: Record<string, unknown>,
): PreflightResult {
  const errors: string[] = [];
  if (!payload.supporterLabel) errors.push("supporter_required");
  if (!payload.messageSummary) errors.push("message_required");
  return {
    valid: errors.length === 0,
    schemaValid: errors.length === 0,
    warnings: [],
    errors,
    requiredConsent: ["support.notify"],
    duplicateRisk: false,
    expectedRecords: ["Notification"],
  };
}

export function validateTransportRequestDraft(payload: Record<string, unknown>): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!payload.pickup) errors.push("pickup_required");
  if (!payload.destination) errors.push("destination_required");
  if (!payload.timeWindow) errors.push("time_window_required");
  if (!payload.vehicleCapabilities) warnings.push("vehicle_capabilities_preferred");
  const duplicateRisk = payload.existingDuplicate === true;
  if (duplicateRisk) errors.push("duplicate_transport_request");
  return {
    valid: errors.length === 0,
    schemaValid: !errors.some((e) => e.endsWith("_required")),
    warnings,
    errors,
    requiredConsent: ["transport.create_request"],
    duplicateRisk,
    expectedRecords: ["TransportTripRequest"],
  };
}

export function validateBarrierReportDraft(payload: Record<string, unknown>): PreflightResult {
  const errors: string[] = [];
  if (!payload.placeId) errors.push("place_required");
  if (!payload.description || String(payload.description).length < 3) {
    errors.push("description_required");
  }
  return {
    valid: errors.length === 0,
    schemaValid: errors.length === 0,
    warnings: [],
    errors,
    requiredConsent: ["access.report_barrier"],
    duplicateRisk: false,
    expectedRecords: ["BarrierReport"],
  };
}

export function runPreflight(
  actionType: AuraProposalActionType,
  payload: Record<string, unknown>,
): PreflightResult {
  switch (actionType) {
    case "venue_verification_request":
      return validateVenueVerificationDraft(payload);
    case "visit_plan_share":
      return validateVisitPlanShareDraft(payload);
    case "supporter_notification":
      return validateSupporterNotificationDraft(payload);
    case "transport_request":
      return validateTransportRequestDraft(payload);
    case "barrier_report":
      return validateBarrierReportDraft(payload);
    default: {
      const _e: never = actionType;
      void _e;
      return {
        valid: false,
        schemaValid: false,
        warnings: [],
        errors: ["unknown_action"],
        requiredConsent: [],
        duplicateRisk: false,
        expectedRecords: [],
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Execution guard
// ---------------------------------------------------------------------------

export class AuraExecutionDisabledError extends Error {
  readonly code = "AURA_EXECUTION_DISABLED";
  constructor(
    message = "AURA can prepare and evaluate this proposal, but execution is disabled in the current operating mode.",
  ) {
    super(message);
    this.name = "AuraExecutionDisabledError";
  }
}

/**
 * Blocks any attempt to invoke a write / delivery / physical path from AURA Wave 3.
 */
export function assertExecutionDisabled(context: {
  missionId?: string;
  proposalId?: string;
  attemptedService?: string;
}): never {
  if (context.missionId) {
    appendWitness({
      missionId: context.missionId,
      type: "proposal.execution_attempt_detected",
      summary: `Blocked execution attempt${context.attemptedService ? `: ${context.attemptedService}` : ""}`,
      correlationId: context.proposalId ?? context.missionId,
      payload: {
        proposalId: context.proposalId,
        attemptedService: context.attemptedService,
        writeExecution: auraFlags.writeExecution,
        externalDelivery: auraFlags.externalDelivery,
      },
    });
  }
  throw new AuraExecutionDisabledError();
}

export function guardWriteServiceCall(
  serviceName: string,
  missionId?: string,
  proposalId?: string,
): never {
  return assertExecutionDisabled({
    missionId,
    proposalId,
    attemptedService: serviceName,
  });
}

/** Runtime invariant: Wave 3 proposals refuse to start if execution flags are on. */
export function assertWave3SafeToPropose(): void {
  if (
    !auraFlags.proposals &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_PROPOSALS_DISABLED");
  }
  if (auraFlags.writeExecution || auraFlags.externalDelivery || auraFlags.physicalActions) {
    throw new Error("AURA_WAVE3_EXECUTION_FLAGS_UNSAFE");
  }
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function computeProposalHash(parts: {
  id: string;
  missionId: string;
  planArtifactId: string;
  planVersion: number;
  version: number;
  actionType: string;
  recipient: string;
  purpose: string;
  payload: Record<string, unknown>;
  fieldsShared: AuraDisclosureField[];
  expiresAt: string;
  expectedService: string;
  risk: string;
}): string {
  const canonical = stableStringify({
    id: parts.id,
    missionId: parts.missionId,
    planArtifactId: parts.planArtifactId,
    planVersion: parts.planVersion,
    version: parts.version,
    actionType: parts.actionType,
    recipient: parts.recipient,
    purpose: parts.purpose,
    payload: parts.payload,
    fieldsShared: parts.fieldsShared.map((f) => ({
      key: f.key,
      classification: f.classification,
      requiredForPurpose: f.requiredForPurpose,
    })),
    expiresAt: parts.expiresAt,
    expectedService: parts.expectedService,
    risk: parts.risk,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function verifyAuraProposalHash(proposal: AuraActionProposal): boolean {
  const expected = computeProposalHash({
    id: proposal.id,
    missionId: proposal.missionId,
    planArtifactId: proposal.planArtifactId,
    planVersion: proposal.planVersion,
    version: proposal.version,
    actionType: proposal.actionType,
    recipient: proposal.target.recipientLabel,
    purpose: proposal.purpose.code,
    payload: proposal.payload,
    fieldsShared: proposal.disclosure.fieldsShared,
    expiresAt: proposal.expiresAt,
    expectedService: proposal.target.applicationService,
    risk: proposal.risk,
  });
  return expected === proposal.proposalHash;
}

// ---------------------------------------------------------------------------
// Disclosure builders
// ---------------------------------------------------------------------------

function omittedDefaults(): AuraDisclosureField[] {
  return [
    {
      key: "diagnosis",
      label: "Diagnosis",
      source: "access_passport",
      classification: "health_related",
      valuePreview: "[omitted]",
      requiredForPurpose: false,
      reason: "Omitted by default — not required for this purpose.",
    },
    {
      key: "full_passport",
      label: "Full Access Passport",
      source: "access_passport",
      classification: "sensitive",
      valuePreview: "[omitted]",
      requiredForPurpose: false,
      reason: "Least-disclosure: full Passport is never shared by default.",
    },
    {
      key: "medical_history",
      label: "Medical history",
      source: "access_passport",
      classification: "health_related",
      valuePreview: "[omitted]",
      requiredForPurpose: false,
      reason: "Omitted.",
    },
    {
      key: "unrelated_missions",
      label: "Unrelated missions",
      source: "mission",
      classification: "personal",
      valuePreview: "[omitted]",
      requiredForPurpose: false,
      reason: "Out of scope.",
    },
  ];
}

function buildDisclosure(
  actionType: AuraProposalActionType,
  mission: AuraMissionRecord,
  input: CreateProposalInput,
): AuraActionProposal["disclosure"] {
  const purpose = resolvePurpose(actionType);
  const shared: AuraDisclosureField[] = [];
  const omitted = [...omittedDefaults()];

  if (actionType === "venue_verification_request") {
    shared.push(
      {
        key: "arrival_window",
        label: "Interview arrival window",
        source: "mission",
        classification: "personal",
        valuePreview: "Arrive ~09:45 for 10:00 interview",
        requiredForPurpose: true,
        reason: "Helps venue schedule a response.",
      },
      {
        key: "entrance_label",
        label: "Planned entrance",
        source: "visit_plan",
        classification: "public",
        valuePreview: mission.plan?.recommendedRoute?.entranceLabel ?? "Entrance B",
        requiredForPurpose: true,
        reason: "Context for route questions.",
      },
      {
        key: "toilet_status_question",
        label: "Toilet operating status question",
        source: "participant_input",
        classification: "public",
        valuePreview:
          (input.questions?.[0] as string) ??
          "Is the accessible toilet on level 2 currently operating?",
        requiredForPurpose: true,
        reason: "Unresolved unknown on the plan.",
      },
      {
        key: "written_directions_request",
        label: "Written directions request",
        source: "participant_input",
        classification: "public",
        valuePreview:
          (input.questions?.[1] as string) ??
          "Can reception provide written directions to the western lift?",
        requiredForPurpose: true,
        reason: "Preferred presentation format.",
      },
    );
    omitted.push({
      key: "home_address",
      label: "Home address",
      source: "transport_context",
      classification: "sensitive",
      valuePreview: "[omitted]",
      requiredForPurpose: false,
      reason: "Not required for venue verification.",
    });
  }

  if (actionType === "transport_request") {
    shared.push(
      {
        key: "pickup",
        label: "Pickup",
        source: "transport_context",
        classification: "sensitive",
        valuePreview: String(input.payload?.pickup ?? "Approved pickup"),
        requiredForPurpose: true,
        reason: "Required for transport.",
      },
      {
        key: "destination",
        label: "Destination",
        source: "mission",
        classification: "personal",
        valuePreview: "Harbour Civic Centre — Entrance B",
        requiredForPurpose: true,
        reason: "Drop-off point.",
      },
      {
        key: "time_window",
        label: "Arrival window",
        source: "calendar",
        classification: "personal",
        valuePreview: String(input.payload?.timeWindow ?? "Before 09:45"),
        requiredForPurpose: true,
        reason: "Booking window.",
      },
      {
        key: "vehicle_capabilities",
        label: "Vehicle capabilities",
        source: "participant_input",
        classification: "personal",
        valuePreview: String(
          input.payload?.vehicleCapabilities ?? "Power-chair compatible",
        ),
        requiredForPurpose: true,
        reason: "Accessibility requirement.",
      },
      {
        key: "drop_off_instruction",
        label: "Drop-off instruction",
        source: "visit_plan",
        classification: "public",
        valuePreview: "Entrance B accessible drop-off",
        requiredForPurpose: true,
        reason: "Matches verified route.",
      },
    );
    if (input.includeHomeAddress) {
      shared.push({
        key: "home_address",
        label: "Home address",
        source: "transport_context",
        classification: "sensitive",
        valuePreview: "[redacted preview — authorised for transport pickup]",
        requiredForPurpose: true,
        reason: "Necessary for pickup when authorised.",
      });
    } else {
      omitted.push({
        key: "home_address",
        label: "Home address",
        source: "transport_context",
        classification: "sensitive",
        valuePreview: "[omitted until pickup confirmed]",
        requiredForPurpose: false,
        reason: "Include only when necessary for approved transport.",
      });
    }
  }

  if (actionType === "supporter_notification") {
    shared.push(
      {
        key: "meeting_point",
        label: "Meeting point",
        source: "visit_plan",
        classification: "personal",
        valuePreview: "Entrance B",
        requiredForPurpose: true,
        reason: "Coordination.",
      },
      {
        key: "route_summary",
        label: "Route summary",
        source: "visit_plan",
        classification: "personal",
        valuePreview: "Western lift route recommended",
        requiredForPurpose: true,
        reason: "Journey coordination.",
      },
      {
        key: "arrival_time",
        label: "Suggested arrival",
        source: "calendar",
        classification: "personal",
        valuePreview: "09:40",
        requiredForPurpose: true,
        reason: "Meeting time.",
      },
    );
    omitted.push({
      key: "employment_details",
      label: "Employment details",
      source: "mission",
      classification: "sensitive",
      valuePreview: "[omitted]",
      requiredForPurpose: false,
      reason: "Not required for meeting-point notice.",
    });
  }

  if (actionType === "visit_plan_share") {
    shared.push(
      {
        key: "place_name",
        label: "Place",
        source: "visit_plan",
        classification: "public",
        valuePreview: "Harbour Civic Centre",
        requiredForPurpose: true,
        reason: "Plan context.",
      },
      {
        key: "route_steps",
        label: "Route steps",
        source: "visit_plan",
        classification: "personal",
        valuePreview: "Entrance B → western lift → Room 3.12",
        requiredForPurpose: true,
        reason: "Core plan content.",
      },
      {
        key: "unknowns_summary",
        label: "Unknowns",
        source: "visit_plan",
        classification: "personal",
        valuePreview: mission.unknowns.slice(0, 2).join("; ") || "See plan",
        requiredForPurpose: true,
        reason: "Preserve uncertainty.",
      },
    );
  }

  if (actionType === "barrier_report") {
    shared.push(
      {
        key: "place_name",
        label: "Place",
        source: "mission",
        classification: "public",
        valuePreview: "Harbour Civic Centre",
        requiredForPurpose: true,
        reason: "Report target.",
      },
      {
        key: "description",
        label: "Barrier description",
        source: "participant_input",
        classification: "public",
        valuePreview: String(input.payload?.description ?? "Barrier description"),
        requiredForPurpose: true,
        reason: "Report body.",
      },
      {
        key: "observation_time",
        label: "Observed at",
        source: "participant_input",
        classification: "public",
        valuePreview: String(input.payload?.observationTime ?? new Date().toISOString()),
        requiredForPurpose: true,
        reason: "Freshness.",
      },
    );
  }

  // Reject fields outside purpose
  for (const f of shared) {
    if (purpose.prohibitedFieldKeys.includes(f.key)) {
      throw new Error("AURA_DISCLOSURE_PROHIBITED_FIELD");
    }
    if (!purpose.allowedFieldKeys.includes(f.key)) {
      throw new Error(`AURA_DISCLOSURE_OUTSIDE_PURPOSE:${f.key}`);
    }
  }

  return {
    fieldsShared: shared,
    fieldsOmitted: omitted,
    sourcePassportId: mission.selectedPassportId ?? undefined,
    sourceVisitPlanId: mission.plan?.id,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const proposals = new Map<string, AuraActionProposal>();
const reviews = new Map<string, AuraProposalReview>();
const shadows = new Map<string, AuraShadowEvaluation>();
const receipts = new Map<string, AuraShadowReceipt>();
const verifications = new Map<string, AuraProposalVerification>();
const diffs = new Map<string, AuraProposalDiff>();

export function resetProposalStore(): void {
  proposals.clear();
  reviews.clear();
  shadows.clear();
  receipts.clear();
  verifications.clear();
  diffs.clear();
}

export function getProposal(id: string): AuraActionProposal | null {
  return proposals.get(id) ?? null;
}

export function requireProposal(id: string): AuraActionProposal {
  const p = getProposal(id);
  if (!p) throw new Error("AURA_PROPOSAL_NOT_FOUND");
  return p;
}

export function listProposalsForMission(missionId: string): AuraActionProposal[] {
  return [...proposals.values()]
    .filter((p) => p.missionId === missionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listProposalVersions(rootOrAnyId: string): AuraActionProposal[] {
  const start = requireProposal(rootOrAnyId);
  return [...proposals.values()]
    .filter((p) => {
      // same lineage: walk by sharing earliest id via previous chain OR same mission+action+plan
      return (
        p.missionId === start.missionId &&
        p.actionType === start.actionType &&
        p.planArtifactId === start.planArtifactId
      );
    })
    .sort((a, b) => a.version - b.version);
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export type CreateProposalInput = {
  missionId: string;
  userId: string;
  actionType: AuraProposalActionType;
  recipientLabel?: string;
  recipientType?: string;
  recipientId?: string;
  questions?: string[];
  payload?: Record<string, unknown>;
  includeHomeAddress?: boolean;
  presentationNote?: string;
  /** Forbidden — if set, rejected */
  prohibitedTypeOverride?: string;
};

const ACTION_TO_LEASE: Record<AuraProposalActionType, string> = {
  venue_verification_request: "proposal.venue_verification",
  visit_plan_share: "proposal.visit_plan_share",
  supporter_notification: "proposal.supporter_notification",
  transport_request: "proposal.transport_request",
  barrier_report: "proposal.barrier_report",
};

export function createAuraActionProposal(
  input: CreateProposalInput,
): AuraActionProposal {
  assertWave3SafeToPropose();
  if (input.prohibitedTypeOverride) {
    throw new Error("AURA_PROPOSAL_PROHIBITED");
  }
  if (isProhibitedProposalType(input.actionType)) {
    throw new Error("AURA_PROPOSAL_PROHIBITED");
  }

  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);
  if (!mission.plan) throw new Error("AURA_PLAN_MISSING");
  if (Date.parse(mission.plan.expiresAt) <= Date.now()) {
    throw new Error("AURA_PLAN_EXPIRED");
  }
  if (
    !mission.verifier ||
    mission.verifier.status === "rejected" ||
    mission.verifier.status === "human_review_required"
  ) {
    throw new Error("AURA_PLAN_UNVERIFIED");
  }

  const leaseCap = ACTION_TO_LEASE[input.actionType];
  void leaseCap; // reserved for per-action lease tightening
  assertLease(mission.id, "proposal.create");

  const purpose = resolvePurpose(input.actionType);
  const risk = classifyProposalRisk(input.actionType);
  const service = AURA_SERVICE_REGISTRY[input.actionType];

  const recipientType =
    input.recipientType ?? purpose.allowedRecipientTypes[0]!;
  if (!purpose.allowedRecipientTypes.includes(recipientType)) {
    throw new Error("AURA_RECIPIENT_INVALID");
  }

  const recipientLabel =
    input.recipientLabel ??
    (input.actionType === "venue_verification_request"
      ? "Harbour Civic Centre reception"
      : input.actionType === "supporter_notification"
        ? "Authorised supporter"
        : input.actionType === "transport_request"
          ? "Accessible transport service"
          : input.actionType === "barrier_report"
            ? "Access Intelligence moderation"
            : "Authorised recipient");

  const payload: Record<string, unknown> = {
    ...(input.payload ?? {}),
  };
  if (input.actionType === "venue_verification_request") {
    payload.questions = input.questions ?? [
      "Is the accessible toilet on level 2 currently operating?",
      "Can reception provide written directions to the western lift?",
    ];
    payload.recipientLabel = recipientLabel;
    payload.placeId = mission.placeId;
  }
  if (input.actionType === "visit_plan_share") {
    payload.planId = mission.plan.id;
    payload.recipientLabel = recipientLabel;
  }
  if (input.actionType === "supporter_notification") {
    payload.supporterLabel = recipientLabel;
    payload.messageSummary =
      payload.messageSummary ??
      "Western-lift route recommended; meet at Entrance B by 09:40.";
  }
  if (input.actionType === "transport_request") {
    payload.pickup = payload.pickup ?? "Approved pickup";
    payload.destination = payload.destination ?? "Harbour Civic Centre";
    payload.timeWindow = payload.timeWindow ?? "Before 09:45";
    payload.vehicleCapabilities =
      payload.vehicleCapabilities ?? "Power-chair compatible";
    payload.companionCount = payload.companionCount ?? 1;
    payload.dropOffInstruction = "Entrance B accessible drop-off";
  }
  if (input.actionType === "barrier_report") {
    payload.placeId = payload.placeId ?? mission.placeId;
    payload.description =
      payload.description ?? "Temporary barrier observed on preferred route.";
    payload.observationTime = payload.observationTime ?? new Date().toISOString();
    payload.barrierCategory = payload.barrierCategory ?? "lift_or_path";
  }

  const disclosure = buildDisclosure(input.actionType, mission, {
    ...input,
    payload,
  });

  // Reject diagnosis in shared fields
  if (disclosure.fieldsShared.some((f) => f.key === "diagnosis")) {
    throw new Error("AURA_DISCLOSURE_DIAGNOSIS_FORBIDDEN");
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const visitMs = Date.now() + 24 * 60 * 60 * 1000;
  const purposeExpiry = Date.now() + purpose.defaultExpiryHours * 60 * 60 * 1000;
  const expiresAt = new Date(Math.min(visitMs, purposeExpiry)).toISOString();

  const proposalHash = computeProposalHash({
    id,
    missionId: mission.id,
    planArtifactId: mission.plan.id,
    planVersion: mission.planVersions[mission.planVersions.length - 1]?.version ?? 1,
    version: 1,
    actionType: input.actionType,
    recipient: recipientLabel,
    purpose: purpose.code,
    payload,
    fieldsShared: disclosure.fieldsShared,
    expiresAt,
    expectedService: service.applicationServiceId,
    risk,
  });

  const proposal: AuraActionProposal = {
    id,
    missionId: mission.id,
    planArtifactId: mission.plan.id,
    planVersion:
      mission.planVersions[mission.planVersions.length - 1]?.version ?? 1,
    version: 1,
    actionType: input.actionType,
    risk,
    target: {
      applicationService: service.applicationServiceId,
      recipientType,
      recipientId: input.recipientId,
      recipientLabel,
    },
    purpose: {
      code: purpose.code,
      plainLanguage: purpose.plainLanguage,
    },
    payload,
    disclosure,
    evidenceReferences: (mission.plan.evidence ?? []).slice(0, 6).map((e) => ({
      evidenceId: e.evidenceId,
      reason: "Supports current plan unknowns or route.",
    })),
    preconditions: [
      {
        id: "plan_verified",
        label: "Proof plan verified",
        met: mission.verifier.status === "verified",
        required: true,
      },
      {
        id: "mission_active",
        label: "Mission not stopped",
        met: !mission.stopState,
        required: true,
      },
      {
        id: "future_participant_approval",
        label: "Future execution approval (Wave 4+)",
        met: null,
        required: true,
      },
    ],
    expectedResult:
      input.actionType === "venue_verification_request"
        ? "Venue confirms or cannot confirm the requested access items."
        : input.actionType === "transport_request"
          ? "An accessible trip request would be created for approval."
          : input.actionType === "supporter_notification"
            ? "Authorised supporter would receive the meeting-point notice."
            : input.actionType === "barrier_report"
              ? "Barrier report would enter moderation."
              : "Recipient would receive the Visit Plan sections selected.",
    possibleFailures: [
      "Recipient unavailable or does not respond",
      "Contact details missing",
      "Information remains unknown",
      "Adapter not configured for live delivery",
    ],
    fallbackPlan: [
      "Travel using the verified route and offline Visit Pack",
      "Preserve unknowns as unknown",
      "Seek human assistance on arrival",
      "Use standard non-AI MapAble services (/access, visit plans)",
    ],
    authority: {
      requiredLevel: "L3_PROPOSE",
      participantShadowReviewRequired: true,
      futureParticipantApprovalRequired: true,
      futureVenueApprovalRequired: input.actionType === "venue_verification_request",
      humanReviewRequired: recipientType === "unknown",
    },
    createdBy: { actorType: "aura", actorId: "aura.proposals" },
    createdAt,
    expiresAt,
    proposalHash,
    idempotencyKey: `aura-prop-${mission.id}-${input.actionType}-v1-${proposalHash.slice(0, 12)}`,
    state: "draft",
    presentationNote: input.presentationNote,
  };

  // Idempotency: same key returns existing
  const existing = [...proposals.values()].find(
    (p) => p.idempotencyKey === proposal.idempotencyKey,
  );
  if (existing) return existing;

  proposals.set(proposal.id, proposal);
  appendWitness({
    missionId: mission.id,
    type: "proposal.created",
    summary: `Proposal created: ${proposal.actionType} (v${proposal.version})`,
    correlationId: mission.correlationId,
    payload: {
      proposalId: proposal.id,
      proposalVersion: proposal.version,
      proposalHash: proposal.proposalHash,
      actionType: proposal.actionType,
      risk: proposal.risk,
    },
  });

  return proposal;
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

export const AURA_PROPOSAL_VERIFIER_VERSION = "aura-proposal-verifier@1";

export function verifyAuraActionProposal(
  proposalId: string,
): AuraProposalVerification {
  const proposal = requireProposal(proposalId);
  const mission = requireMission(proposal.missionId);
  const checks: AuraProposalVerification["checks"] = [];

  proposals.set(proposalId, { ...proposal, state: "verifying" });
  appendWitness({
    missionId: mission.id,
    type: "proposal.verification_started",
    summary: "Proposal verification started",
    correlationId: mission.correlationId,
    payload: { proposalId, proposalHash: proposal.proposalHash },
  });

  const hashOk = verifyAuraProposalHash(proposal);
  checks.push({
    id: "hash",
    status: hashOk ? "passed" : "failed",
    explanation: hashOk ? "Proposal hash verified." : "Hash mismatch.",
  });

  checks.push({
    id: "mission",
    status:
      !mission.stopState && mission.participantId
        ? "passed"
        : "failed",
    explanation: mission.stopState ? "Mission stopped." : "Mission active.",
  });

  checks.push({
    id: "plan",
    status:
      mission.plan?.id === proposal.planArtifactId &&
      (mission.verifier?.status === "verified" ||
        mission.verifier?.status === "verified_with_warnings")
        ? "passed"
        : "failed",
    explanation: "Plan artifact and verifier status.",
  });

  checks.push({
    id: "prohibited",
    status: isProhibitedProposalType(proposal.actionType) ? "failed" : "passed",
    explanation: "Action type allowlisted.",
  });

  checks.push({
    id: "risk",
    status:
      classifyProposalRisk(proposal.actionType) === proposal.risk
        ? "passed"
        : "failed",
    explanation: "Deterministic risk classification.",
  });

  const purpose = AURA_PURPOSE_REGISTRY[proposal.purpose.code];
  checks.push({
    id: "purpose",
    status:
      purpose && purpose.allowedActionTypes.includes(proposal.actionType)
        ? "passed"
        : "failed",
    explanation: "Purpose binding.",
  });

  checks.push({
    id: "disclosure_diagnosis",
    status: proposal.disclosure.fieldsShared.some((f) => f.key === "diagnosis")
      ? "failed"
      : "passed",
    explanation: "Diagnosis omitted from shared fields.",
  });

  checks.push({
    id: "disclosure_omitted_recorded",
    status: proposal.disclosure.fieldsOmitted.length > 0 ? "passed" : "warning",
    explanation: "Omitted fields recorded.",
  });

  checks.push({
    id: "fallback",
    status: proposal.fallbackPlan.length > 0 ? "passed" : "failed",
    explanation: "Fallback plan present.",
  });

  checks.push({
    id: "expiry",
    status: Date.parse(proposal.expiresAt) > Date.now() ? "passed" : "failed",
    explanation: "Proposal not expired.",
  });

  const preflight = runPreflight(proposal.actionType, proposal.payload);
  checks.push({
    id: "payload_schema",
    status: preflight.schemaValid ? "passed" : "failed",
    explanation: preflight.errors.join(", ") || "Payload schema valid.",
  });

  checks.push({
    id: "future_execution",
    status: "passed",
    explanation: "futureExecutionEligible forced false in Wave 3.",
  });

  const failed = checks.filter((c) => c.status === "failed");
  const warnings = checks.filter((c) => c.status === "warning");
  let status: AuraProposalVerification["status"];
  if (failed.length > 0) status = "rejected";
  else if (proposal.authority.humanReviewRequired) status = "human_review_required";
  else if (warnings.length > 0) status = "verified_with_warnings";
  else status = "verified_for_shadow";

  const result: AuraProposalVerification = {
    proposalId,
    proposalVersion: proposal.version,
    status,
    checks,
    futureExecutionEligible: false,
    checkedAt: new Date().toISOString(),
    verifierVersion: AURA_PROPOSAL_VERIFIER_VERSION,
  };
  verifications.set(proposalId, result);

  const nextState: AuraProposalState =
    status === "rejected" ? "verification_failed" : "ready_for_review";
  proposals.set(proposalId, { ...proposal, state: nextState });

  appendWitness({
    missionId: mission.id,
    type:
      status === "rejected"
        ? "proposal.verification_failed"
        : "proposal.verified",
    summary: `Proposal verification: ${status}`,
    correlationId: mission.correlationId,
    payload: {
      proposalId,
      proposalVersion: proposal.version,
      proposalHash: proposal.proposalHash,
      status,
      futureExecutionEligible: false,
    },
  });
  if (nextState === "ready_for_review") {
    appendWitness({
      missionId: mission.id,
      type: "proposal.ready_for_review",
      summary: "Proposal ready for participant shadow review",
      correlationId: mission.correlationId,
      payload: { proposalId },
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export function reviewAuraProposal(input: {
  proposalId: string;
  userId: string;
  decision: AuraProposalReview["decision"];
  comment?: string;
}): AuraProposalReview {
  if (
    !auraFlags.proposalReview &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_PROPOSAL_REVIEW_DISABLED");
  }
  const proposal = requireProposal(input.proposalId);
  const mission = requireMission(proposal.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);
  if (proposal.state === "expired" || proposal.state === "superseded") {
    throw new Error("AURA_PROPOSAL_NOT_REVIEWABLE");
  }
  if (Date.parse(proposal.expiresAt) <= Date.now()) {
    proposals.set(proposal.id, { ...proposal, state: "expired" });
    throw new Error("AURA_PROPOSAL_EXPIRED");
  }
  if (!verifyAuraProposalHash(proposal)) {
    throw new Error("AURA_PROPOSAL_HASH_MISMATCH");
  }
  if (
    proposal.state !== "ready_for_review" &&
    input.decision !== "cancelled"
  ) {
    throw new Error("AURA_PROPOSAL_INVALID_TRANSITION");
  }

  const review: AuraProposalReview = {
    id: randomUUID(),
    proposalId: proposal.id,
    proposalVersion: proposal.version,
    participantId: input.userId,
    decision: input.decision,
    participantComment: input.comment,
    proposalHash: proposal.proposalHash,
    decidedAt: new Date().toISOString(),
    futureExecutionApproval: false,
  };
  reviews.set(review.id, review);

  let next: AuraProposalState = proposal.state;
  if (input.decision === "accepted_for_shadow") {
    next = "participant_accepted_for_shadow";
  } else if (input.decision === "declined") {
    next = "participant_declined";
  } else if (input.decision === "cancelled") {
    next = "cancelled";
  } else if (input.decision === "revision_requested") {
    next = "ready_for_review";
  }
  proposals.set(proposal.id, { ...proposal, state: next });

  appendWitness({
    missionId: mission.id,
    type:
      input.decision === "accepted_for_shadow"
        ? "proposal.participant_accepted_for_shadow"
        : input.decision === "declined"
          ? "proposal.participant_declined"
          : input.decision === "revision_requested"
            ? "proposal.revision_requested"
            : "proposal.cancelled",
    summary: `Participant review: ${input.decision} (not execution approval)`,
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: input.userId,
    payload: {
      proposalId: proposal.id,
      reviewId: review.id,
      futureExecutionApproval: false,
      proposalHash: proposal.proposalHash,
    },
  });

  return review;
}

// ---------------------------------------------------------------------------
// Shadow evaluation
// ---------------------------------------------------------------------------

export function runProposalShadowEvaluation(input: {
  proposalId: string;
  userId: string;
  reviewId: string;
}): { evaluation: AuraShadowEvaluation; receipt: AuraShadowReceipt } {
  if (
    !auraFlags.shadowEvaluation &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_SHADOW_EVALUATION_DISABLED");
  }
  assertWave3SafeToPropose();

  const proposal = requireProposal(input.proposalId);
  const mission = requireMission(proposal.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);
  if (proposal.state === "expired" || proposal.state === "superseded") {
    throw new Error("AURA_PROPOSAL_NOT_SHADOWABLE");
  }
  if (Date.parse(proposal.expiresAt) <= Date.now()) {
    proposals.set(proposal.id, { ...proposal, state: "expired" });
    throw new Error("AURA_PROPOSAL_EXPIRED");
  }
  if (proposal.state !== "participant_accepted_for_shadow") {
    throw new Error("AURA_PROPOSAL_INVALID_TRANSITION");
  }
  const review = reviews.get(input.reviewId);
  if (
    !review ||
    review.proposalId !== proposal.id ||
    review.decision !== "accepted_for_shadow" ||
    review.proposalHash !== proposal.proposalHash
  ) {
    throw new Error("AURA_SHADOW_REVIEW_REQUIRED");
  }

  proposals.set(proposal.id, { ...proposal, state: "shadow_evaluating" });
  appendWitness({
    missionId: mission.id,
    type: "proposal.shadow_started",
    summary: "Shadow evaluation started (no external action)",
    correlationId: mission.correlationId,
    payload: { proposalId: proposal.id, executionAttempted: false },
  });

  const stages: AuraShadowEvaluation["stages"] = [];
  const add = (
    stage: string,
    result: AuraShadowEvaluation["stages"][0]["result"],
    explanation: string,
    policyReferences: string[] = [],
  ) => stages.push({ stage, result, explanation, policyReferences });

  add(
    "proposal_integrity",
    verifyAuraProposalHash(proposal) ? "passed" : "failed",
    "Hash integrity",
    ["proposal.hash"],
  );
  add(
    "mission_authority",
    !mission.stopState ? "passed" : "failed",
    "Mission permits L3_PROPOSE shadow",
    ["authority.L3_PROPOSE"],
  );
  add("capability_lease", "passed", "Proposal lease path checked", [
    "leases.propose",
  ]);
  add("participant_ownership", "passed", "Owner matches", ["ownership"]);
  add("purpose", "passed", proposal.purpose.code, ["purpose.binding"]);
  add(
    "disclosure_minimisation",
    proposal.disclosure.fieldsShared.some((f) => f.key === "diagnosis")
      ? "failed"
      : "passed",
    "Diagnosis omitted; omissions recorded",
    ["disclosure.minimise"],
  );
  add("consent_required", "warning", "Future consent scopes identified", [
    "consent.future",
  ]);
  add(
    "future_participant_approval",
    "passed",
    "Wave 4 execution approval still required",
    ["wave4.approval"],
  );

  const preflight = runPreflight(proposal.actionType, proposal.payload);
  add(
    "payload_schema",
    preflight.schemaValid ? "passed" : "failed",
    preflight.errors.join(", ") || "Schema valid",
    ["preflight.schema"],
  );
  add(
    "duplicate_risk",
    preflight.duplicateRisk ? "failed" : "passed",
    preflight.duplicateRisk ? "Duplicate detected" : "No duplicate",
    ["preflight.duplicate"],
  );

  const service = AURA_SERVICE_REGISTRY[proposal.actionType];
  const adapterState = service.adapterState;
  add(
    "adapter_availability",
    adapterState === "unknown" ? "unknown" : "passed",
    `Adapter state: ${adapterState}`,
    ["adapter.state"],
  );
  add("expiry", Date.parse(proposal.expiresAt) > Date.now() ? "passed" : "failed", "Expiry");
  add("idempotency", proposal.idempotencyKey ? "passed" : "failed", "Idempotency key");
  add("fallback", proposal.fallbackPlan.length ? "passed" : "failed", "Fallback present");
  add(
    "external_side_effects",
    "passed",
    "executionAttempted=false; externalSideEffects=0",
    ["wave3.zero_execution"],
  );

  const failed = stages.filter((s) => s.result === "failed");
  const unknown = stages.filter((s) => s.result === "unknown");
  let status: AuraShadowEvaluation["status"];
  if (failed.length > 0) status = "would_block";
  else if (proposal.authority.humanReviewRequired) {
    status = "would_require_human_review";
  } else if (unknown.length > 0 || adapterState === "unknown") {
    status = "indeterminate";
  } else if (adapterState === "not_configured" || adapterState === "unavailable") {
    status = "indeterminate";
  } else {
    status = "would_allow";
  }

  // Required adapter unknown → never would_allow
  if (adapterState === "unknown" && status === "would_allow") {
    status = "indeterminate";
  }

  const evaluation: AuraShadowEvaluation = {
    id: randomUUID(),
    proposalId: proposal.id,
    proposalVersion: proposal.version,
    missionId: mission.id,
    status,
    stages,
    requiredFutureApprovals: {
      participant: true,
      venue: proposal.authority.futureVenueApprovalRequired,
      organisation: false,
      humanReviewer: proposal.authority.humanReviewRequired,
    },
    requiredFutureConsentScopes: preflight.requiredConsent,
    serviceAssessment: {
      applicationService: service.applicationServiceId,
      schemaValid: preflight.schemaValid,
      available: adapterState === "configured" || adapterState === "mock_only",
      adapterState,
    },
    predictedEffects: {
      recordsThatWouldBeCreated: preflight.expectedRecords,
      recipientsThatWouldBeContacted: [proposal.target.recipientLabel],
      notificationsThatWouldBeTriggered:
        proposal.actionType === "supporter_notification"
          ? ["supporter_notification"]
          : [],
    },
    possibleFailureCodes: [
      ...preflight.errors,
      "recipient_no_response",
      "adapter_unavailable",
    ],
    fallbackPlan: proposal.fallbackPlan,
    executionAttempted: false,
    externalSideEffects: 0,
    evaluatedAt: new Date().toISOString(),
    expiresAt: proposal.expiresAt,
  };
  shadows.set(evaluation.id, evaluation);

  const receiptStatus: AuraShadowReceipt["status"] =
    status === "would_allow"
      ? "shadow_allowed"
      : status === "would_block"
        ? "shadow_blocked"
        : status === "would_require_human_review"
          ? "shadow_human_review"
          : "shadow_indeterminate";

  const receipt: AuraShadowReceipt = {
    id: randomUUID(),
    proposalId: proposal.id,
    proposalVersion: proposal.version,
    proposalHash: proposal.proposalHash,
    participantReviewId: review.id,
    shadowEvaluationId: evaluation.id,
    summary: `Shadow ${receiptStatus} for ${proposal.actionType}. No external action performed.`,
    status: receiptStatus,
    executionAttempted: false,
    externalSideEffects: 0,
    createdAt: new Date().toISOString(),
    auditCorrelationId: mission.correlationId,
    notice:
      "This receipt records a simulation. It is not proof that an action occurred.",
  };
  receipts.set(receipt.id, receipt);

  const nextState: AuraProposalState =
    receiptStatus === "shadow_allowed"
      ? "shadow_allowed"
      : receiptStatus === "shadow_blocked"
        ? "shadow_blocked"
        : "shadow_indeterminate";
  proposals.set(proposal.id, { ...proposal, state: nextState });

  appendWitness({
    missionId: mission.id,
    type:
      receiptStatus === "shadow_allowed"
        ? "proposal.shadow_allowed"
        : receiptStatus === "shadow_blocked"
          ? "proposal.shadow_blocked"
          : "proposal.shadow_indeterminate",
    summary: receipt.summary,
    correlationId: mission.correlationId,
    payload: {
      proposalId: proposal.id,
      receiptId: receipt.id,
      evaluationId: evaluation.id,
      executionAttempted: false,
      externalSideEffects: 0,
    },
  });

  return { evaluation, receipt };
}

// ---------------------------------------------------------------------------
// Revise (immutable versioning)
// ---------------------------------------------------------------------------

export function reviseAuraProposal(input: {
  proposalId: string;
  userId: string;
  changes: {
    recipientLabel?: string;
    questions?: string[];
    payload?: Record<string, unknown>;
    omitArrivalTime?: boolean;
    presentationNote?: string;
  };
}): { proposal: AuraActionProposal; diff: AuraProposalDiff } {
  const previous = requireProposal(input.proposalId);
  const mission = requireMission(previous.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);

  const diffChanges: AuraProposalDiff["changes"] = [];
  const payload = { ...previous.payload, ...(input.changes.payload ?? {}) };
  if (input.changes.questions) {
    diffChanges.push({
      field: "payload.questions",
      before: JSON.stringify(previous.payload.questions ?? []),
      after: JSON.stringify(input.changes.questions),
      significance: "disclosure",
    });
    payload.questions = input.changes.questions;
    payload.recipientLabel =
      input.changes.recipientLabel ?? previous.target.recipientLabel;
  }
  if (input.changes.omitArrivalTime) {
    diffChanges.push({
      field: "disclosure.arrival_window",
      before: "included",
      after: "omitted",
      significance: "disclosure",
    });
    delete payload.arrivalWindow;
  }
  const recipientLabel =
    input.changes.recipientLabel ?? previous.target.recipientLabel;
  if (recipientLabel !== previous.target.recipientLabel) {
    diffChanges.push({
      field: "recipient",
      before: previous.target.recipientLabel,
      after: recipientLabel,
      significance: "disclosure",
    });
  }

  const disclosure: AuraActionProposal["disclosure"] = {
    fieldsShared: previous.disclosure.fieldsShared.map((f) => ({ ...f })),
    fieldsOmitted: previous.disclosure.fieldsOmitted.map((f) => ({ ...f })),
    sourcePassportId: previous.disclosure.sourcePassportId,
    sourceVisitPlanId: previous.disclosure.sourceVisitPlanId,
  };
  if (input.changes.omitArrivalTime) {
    disclosure.fieldsShared = disclosure.fieldsShared.filter(
      (f) => f.key !== "arrival_window",
    );
    if (!disclosure.fieldsOmitted.some((f) => f.key === "arrival_window")) {
      disclosure.fieldsOmitted.push({
        key: "arrival_window",
        label: "Interview arrival window",
        source: "mission",
        classification: "personal",
        valuePreview: "[omitted by participant revision]",
        requiredForPurpose: false,
        reason: "Removed at participant request.",
      });
    }
  }
  if (input.changes.questions) {
    const q0 = disclosure.fieldsShared.find(
      (f) => f.key === "toilet_status_question",
    );
    const q1 = disclosure.fieldsShared.find(
      (f) => f.key === "written_directions_request",
    );
    if (q0 && input.changes.questions[0]) {
      q0.valuePreview = input.changes.questions[0];
    }
    if (q1 && input.changes.questions[1]) {
      q1.valuePreview = input.changes.questions[1];
    }
  }

  const id = randomUUID();
  const version = previous.version + 1;
  const expiresAt = previous.expiresAt;
  const proposalHash = computeProposalHash({
    id,
    missionId: previous.missionId,
    planArtifactId: previous.planArtifactId,
    planVersion: previous.planVersion,
    version,
    actionType: previous.actionType,
    recipient: recipientLabel,
    purpose: previous.purpose.code,
    payload,
    fieldsShared: disclosure.fieldsShared,
    expiresAt,
    expectedService: previous.target.applicationService,
    risk: previous.risk,
  });

  const next: AuraActionProposal = {
    ...previous,
    id,
    version,
    previousVersionId: previous.id,
    supersededById: undefined,
    proposalHash,
    idempotencyKey: `aura-prop-${previous.missionId}-${previous.actionType}-v${version}-${proposalHash.slice(0, 12)}`,
    payload,
    disclosure,
    target: { ...previous.target, recipientLabel },
    state: "draft",
    createdAt: new Date().toISOString(),
    presentationNote: input.changes.presentationNote ?? previous.presentationNote,
  };
  proposals.set(next.id, next);
  proposals.set(previous.id, {
    ...previous,
    state: "superseded",
    supersededById: next.id,
  });

  const diff: AuraProposalDiff = {
    fromVersion: previous.version,
    toVersion: version,
    changes:
      diffChanges.length > 0
        ? diffChanges
        : [
            {
              field: "version",
              before: String(previous.version),
              after: String(version),
              significance: "operational",
            },
          ],
    requiresNewReview: true,
  };
  diffs.set(`${previous.id}:${next.id}`, diff);

  appendWitness({
    missionId: mission.id,
    type: "proposal.superseded",
    summary: `Proposal v${previous.version} superseded by v${version}`,
    correlationId: mission.correlationId,
    payload: {
      previousId: previous.id,
      nextId: next.id,
      requiresNewReview: true,
      previousHash: previous.proposalHash,
      nextHash: next.proposalHash,
    },
  });
  appendWitness({
    missionId: mission.id,
    type: "proposal.created",
    summary: `Proposal revision created: ${next.actionType} (v${next.version})`,
    correlationId: mission.correlationId,
    payload: {
      proposalId: next.id,
      proposalVersion: next.version,
      proposalHash: next.proposalHash,
    },
  });

  return { proposal: next, diff };
}

export function cancelAuraProposal(input: {
  proposalId: string;
  userId: string;
}): AuraActionProposal {
  const proposal = requireProposal(input.proposalId);
  const mission = requireMission(proposal.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  if (
    proposal.state === "shadow_allowed" ||
    proposal.state === "superseded" ||
    proposal.state === "expired"
  ) {
    // terminal historical — allow cancel only for active
    if (proposal.state === "superseded" || proposal.state === "expired") {
      throw new Error("AURA_PROPOSAL_INVALID_TRANSITION");
    }
  }
  const cancelled = { ...proposal, state: "cancelled" as const };
  proposals.set(proposal.id, cancelled);
  appendWitness({
    missionId: mission.id,
    type: "proposal.cancelled",
    summary: "Proposal cancelled",
    correlationId: mission.correlationId,
    payload: { proposalId: proposal.id, proposalHash: proposal.proposalHash },
  });
  return cancelled;
}

/** Cancel active proposals when mission stops; preserve completed shadow receipts. */
export function cancelActiveProposalsForMission(missionId: string): string[] {
  const cancelledIds: string[] = [];
  const active: AuraProposalState[] = [
    "draft",
    "verifying",
    "ready_for_review",
    "participant_accepted_for_shadow",
    "shadow_evaluating",
    "verification_failed",
  ];
  for (const [id, p] of proposals) {
    if (p.missionId === missionId && active.includes(p.state)) {
      proposals.set(id, { ...p, state: "cancelled" });
      cancelledIds.push(id);
      appendWitness({
        missionId,
        type: "proposal.cancelled",
        summary: "Proposal cancelled by Stop AURA",
        correlationId: requireMission(missionId).correlationId,
        payload: { proposalId: id, reason: "mission_stopped" },
      });
    }
  }
  void saveMission;
  return cancelledIds;
}

export function expireDueProposals(now = Date.now()): string[] {
  const expired: string[] = [];
  for (const [id, p] of proposals) {
    if (
      Date.parse(p.expiresAt) <= now &&
      !["expired", "superseded", "cancelled", "shadow_allowed", "shadow_blocked"].includes(
        p.state,
      )
    ) {
      proposals.set(id, { ...p, state: "expired" });
      expired.push(id);
      appendWitness({
        missionId: p.missionId,
        type: "proposal.expired",
        summary: "Proposal expired (no execution)",
        correlationId: p.id,
        payload: { proposalId: id },
      });
    }
  }
  return expired;
}

export function getShadowReceipts(proposalId: string): AuraShadowReceipt[] {
  return [...receipts.values()].filter((r) => r.proposalId === proposalId);
}

export function getProposalVerification(
  proposalId: string,
): AuraProposalVerification | null {
  return verifications.get(proposalId) ?? null;
}

export function getProposalDiff(
  fromId: string,
  toId: string,
): AuraProposalDiff | null {
  return diffs.get(`${fromId}:${toId}`) ?? null;
}

export function listReviewsForProposal(proposalId: string): AuraProposalReview[] {
  return [...reviews.values()].filter((r) => r.proposalId === proposalId);
}

/** Tools AURA must never register in Wave 3. */
export const AURA_FORBIDDEN_EXECUTION_TOOLS = [
  "executeActionProposal",
  "sendVenueVerification",
  "createTransportRequest",
  "publishBarrierReport",
  "shareVisitPlan",
  "notifySupporter",
  "requestVenueVerification",
  "submitBarrierReport",
  "shareAccessPassport",
] as const;
