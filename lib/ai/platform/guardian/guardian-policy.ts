import { evaluateSafeguardingGate } from "@/lib/ai/platform/policies/safeguarding-gate";
import type { DataClass } from "@/lib/ai/platform/types/classification";
import { isGuardianOperational } from "@/lib/config/guardian";

import type {
  GuardianDecision,
  GuardianEvaluateRequest,
  GuardianExplanation,
  GuardianModelSignal,
} from "./contracts";
import { GUARDIAN_POLICY_VERSION } from "./contracts";
import { evaluatePrivacyGate } from "./privacy-gate";
import { routeProcessing } from "./processing-router";
import { maxSensitivity } from "./processing-sensitivity";
import { evaluatePurposePolicy } from "./purpose-policy";
import type { GuardianReasonCode } from "./reason-codes";

function baseExplanation(
  plainLanguage: string,
  nextSteps: string[]
): GuardianExplanation {
  return {
    title: "Why MapAble handled this this way",
    plainLanguage,
    nextSteps,
    humanSupportAvailable: true,
    nonAiPathAvailable: true,
  };
}

function denyDecision(
  partial: Omit<
    GuardianDecision,
    | "participantConfirmationRequired"
    | "humanReviewRequired"
    | "modelSignals"
    | "policyVersion"
    | "explanation"
  > & {
    explanation?: GuardianExplanation;
    participantConfirmationRequired?: boolean;
    humanReviewRequired?: boolean;
    modelSignals?: GuardianModelSignal[];
  }
): GuardianDecision {
  return {
    policyVersion: GUARDIAN_POLICY_VERSION,
    modelSignals: partial.modelSignals ?? [],
    participantConfirmationRequired:
      partial.participantConfirmationRequired ?? false,
    humanReviewRequired: partial.humanReviewRequired ?? false,
    explanation:
      partial.explanation ??
      baseExplanation(
        "MapAble could not continue automated processing for this request.",
        [
          "You can use the manual complaint or incident forms.",
          "Ask for a human support worker if you need help.",
        ]
      ),
    ...partial,
  };
}

/**
 * Deterministic Guardian policy composition.
 * Models (when enabled later) only contribute GuardianModelSignal[]; this function decides.
 */
export function evaluateGuardianPolicy(
  input: GuardianEvaluateRequest,
  modelSignals: GuardianModelSignal[] = []
): GuardianDecision {
  const dataClasses: DataClass[] =
    input.dataClasses.length > 0
      ? input.dataClasses
      : (["operational"] as DataClass[]);
  const sensitivity = maxSensitivity(dataClasses);

  if (!isGuardianOperational()) {
    return denyDecision({
      decision: "ALLOW_WITH_CONDITIONS",
      reasonCodes: ["GUARDIAN_DISABLED", "DETERMINISTIC_FALLBACK"],
      purpose: input.purpose,
      dataClasses,
      sensitivity,
      explanation: baseExplanation(
        "Guardian AI-assisted checks are turned off. Manual and deterministic paths remain available.",
        [
          "Continue with non-AI product flows where safe.",
          "Use manual complaint or incident intake if needed.",
        ]
      ),
    });
  }

  // Reject cloud bypass attempt as a security signal (still evaluate)
  const bypassCodes: GuardianReasonCode[] = [];
  if (input.useCloudModel === true) {
    bypassCodes.push("CLOUD_BYPASS_REJECTED");
  }

  const purposeResult = evaluatePurposePolicy(input.purpose);
  if (!purposeResult.allowed) {
    return denyDecision({
      decision: "DENY_PROHIBITED_ACTION",
      reasonCodes: [...bypassCodes, ...purposeResult.reasonCodes],
      purpose: input.purpose,
      dataClasses,
      sensitivity,
      explanation: baseExplanation(
        "This purpose is not allowed for Guardian-mediated processing.",
        ["Choose an allowed support purpose or contact a human."]
      ),
    });
  }

  const privacy = evaluatePrivacyGate({
    purpose: purposeResult.purpose,
    actorId: input.actorId,
    actorTenantId: input.actorTenantId,
    tenantId: input.tenantId,
    participantId: input.participantId,
    dataClasses,
    consentScopesPresent: input.consentScopesPresent,
    authorityGranted: input.authorityGranted,
    minimumNecessaryFields: input.minimumNecessaryFields,
    requestedFields:
      input.minimumNecessaryFields &&
      input.structuredPayload &&
      Object.keys(input.structuredPayload),
    authorityDecisionId: input.authorityDecisionId,
    consentReceiptIds: input.consentReceiptIds,
  });

  if (!privacy.allowed) {
    const decisionType = privacy.reasonCodes.includes("CROSS_TENANT_DENIED")
      ? "SECURITY_QUARANTINE"
      : privacy.reasonCodes.includes("MINIMUM_NECESSARY_VIOLATION")
        ? "DENY_DATA_DISCLOSURE"
        : "DENY_DATA_DISCLOSURE";

    return denyDecision({
      decision: decisionType,
      reasonCodes: [...bypassCodes, ...privacy.reasonCodes],
      purpose: purposeResult.purpose,
      dataClasses,
      sensitivity: privacy.sensitivity,
      authorityDecisionId: input.authorityDecisionId,
      consentReceiptIds: input.consentReceiptIds,
      explanation: baseExplanation(
        "MapAble cannot disclose or process this information for the requested purpose.",
        [
          "Ask the participant to approve the minimum necessary support information.",
          "Use a human review pathway if this is urgent.",
        ]
      ),
    });
  }

  // Safeguarding gate — authoritative human-only boundary
  const objective =
    input.objectiveText ??
    (typeof input.structuredPayload?.text === "string"
      ? input.structuredPayload.text
      : input.purpose);

  const sg = evaluateSafeguardingGate({
    objective,
    evidenceRefs: input.dataRefs,
    traceId: input.authorityDecisionId,
  });

  if (sg.halted) {
    return denyDecision({
      decision: "ROUTE_TO_HUMAN_REVIEW",
      reasonCodes: [
        ...bypassCodes,
        "SAFEGUARDING_CUE_DETECTED",
        "ROUTE_HUMAN_REVIEW",
      ],
      purpose: purposeResult.purpose,
      dataClasses,
      sensitivity: privacy.sensitivity,
      modelSignals,
      humanReviewRequired: true,
      requiresHumanReportabilityAssessment: true,
      participantConfirmationRequired: false,
      authorityDecisionId: input.authorityDecisionId,
      consentReceiptIds: input.consentReceiptIds,
      aiMayDecideReportability: false,
      aiMaySubstantiateAllegation: false,
      aiMayAuthoriseRestrictivePractice: false,
      aiMayCloseIncidentOrComplaint: false,
      explanation: baseExplanation(sg.continuationMessage, [
        "Your information is preserved.",
        "An authorised human will continue this workflow.",
        "You can also use the manual incident or complaint forms.",
        "If you are in immediate danger, contact emergency services.",
      ]),
    });
  }

  // Complaint / incident assist purposes → route decisions (Phase 4 writes SoR)
  if (purposeResult.purpose === "complaint_intake_assist") {
    return {
      decision: "ROUTE_TO_COMPLAINTS",
      reasonCodes: [...bypassCodes, "ROUTE_COMPLAINTS"],
      policyVersion: GUARDIAN_POLICY_VERSION,
      purpose: purposeResult.purpose,
      dataClasses,
      sensitivity: privacy.sensitivity,
      modelSignals,
      participantConfirmationRequired: true,
      humanReviewRequired: true,
      authorityDecisionId: input.authorityDecisionId,
      consentReceiptIds: input.consentReceiptIds,
      explanation: baseExplanation(
        "MapAble can help prepare a complaint for you to review and submit.",
        [
          "You control submission unless a lawful process requires otherwise.",
          "A human owns the complaint — not an AI.",
        ]
      ),
    };
  }

  if (purposeResult.purpose === "incident_intake_assist") {
    return {
      decision: "ROUTE_TO_INCIDENT_TRIAGE",
      reasonCodes: [...bypassCodes, "ROUTE_INCIDENT_TRIAGE"],
      policyVersion: GUARDIAN_POLICY_VERSION,
      purpose: purposeResult.purpose,
      dataClasses,
      sensitivity: privacy.sensitivity,
      modelSignals,
      participantConfirmationRequired: true,
      humanReviewRequired: true,
      requiresHumanReportabilityAssessment: true,
      aiMayDecideReportability: false,
      authorityDecisionId: input.authorityDecisionId,
      consentReceiptIds: input.consentReceiptIds,
      explanation: baseExplanation(
        "MapAble can help prepare an incident report for human triage.",
        [
          "Reportability is decided by authorised humans only.",
          "Use the manual incident intake if you prefer.",
        ]
      ),
    };
  }

  const routed = routeProcessing({
    sensitivity: privacy.sensitivity,
    dataClasses,
    purpose: purposeResult.purpose,
    privateInferenceAvailable: input.privateInferenceAvailable,
    deviceEdgeAvailable: input.deviceEdgeAvailable,
    useCloudModel: input.useCloudModel,
  });

  if (!routed.ok) {
    if (routed.fallback === "human_review") {
      return denyDecision({
        decision: "ROUTE_TO_HUMAN_REVIEW",
        reasonCodes: [...bypassCodes, ...routed.reasonCodes, "ROUTE_HUMAN_REVIEW"],
        purpose: purposeResult.purpose,
        dataClasses,
        sensitivity: privacy.sensitivity,
        modelSignals,
        humanReviewRequired: true,
        explanation: baseExplanation(
          "Private processing is unavailable. MapAble will not send this data to an external cloud model.",
          [
            "A human can continue this request.",
            "Retry later or use a non-AI pathway.",
          ]
        ),
      });
    }

    return denyDecision({
      decision: "ALLOW_WITH_CONDITIONS",
      reasonCodes: [...bypassCodes, ...routed.reasonCodes, "DETERMINISTIC_FALLBACK"],
      purpose: purposeResult.purpose,
      dataClasses,
      sensitivity: privacy.sensitivity,
      modelSignals,
      explanation: baseExplanation(
        "MapAble will continue with deterministic (non-model) handling only.",
        ["No general-purpose model will receive this data."]
      ),
    });
  }

  if (!routed.modelProcessingAllowed) {
    return {
      decision: "ALLOW_WITH_CONDITIONS",
      reasonCodes: [
        ...bypassCodes,
        ...routed.reasonCodes,
        "MODEL_INFERENCE_DISABLED",
        "DETERMINISTIC_FALLBACK",
      ],
      policyVersion: GUARDIAN_POLICY_VERSION,
      purpose: purposeResult.purpose,
      dataClasses,
      sensitivity: privacy.sensitivity,
      processingZone: routed.zone,
      processorId: routed.processorId,
      modelSignals,
      participantConfirmationRequired: false,
      humanReviewRequired: false,
      authorityDecisionId: input.authorityDecisionId,
      consentReceiptIds: input.consentReceiptIds,
      explanation: baseExplanation(
        "Processing may continue under deterministic rules without a general-purpose model.",
        ["Model inference remains off until approved."]
      ),
    };
  }

  return {
    decision: "ALLOW",
    reasonCodes: [...bypassCodes, ...routed.reasonCodes, "ALLOW_WITHIN_POLICY"],
    policyVersion: GUARDIAN_POLICY_VERSION,
    purpose: purposeResult.purpose,
    dataClasses,
    sensitivity: privacy.sensitivity,
    processingZone: routed.zone,
    processorId: routed.processorId,
    modelSignals,
    participantConfirmationRequired: false,
    humanReviewRequired: false,
    authorityDecisionId: input.authorityDecisionId,
    consentReceiptIds: input.consentReceiptIds,
    explanation: baseExplanation(
      "MapAble authorised this processing for the stated purpose under current policy.",
      ["You can ask for a human explanation at any time."]
    ),
  };
}

/** Hard guarantees for tests — models never decide these. */
export function guardianMayDecideReportability(): false {
  return false;
}

export function guardianMaySubstantiateAllegation(): false {
  return false;
}

export function guardianMayAuthoriseRestrictivePractice(): false {
  return false;
}

export function guardianMayCloseIncidentOrComplaint(): false {
  return false;
}
