import { createHash, randomUUID } from "crypto";

import {
  isCareAgentLlmEnabled,
  runCareIntakeWithLlm,
  runCarePlanExplainerWithLlm,
  runCareTaskTransformerWithLlm,
  runWorkerCapabilityWithLlm,
} from "@/lib/care-agent";
import type { CareLlmStepMeta } from "@/lib/care-agent/intake-llm";
import { runCareGuardrailAgent } from "@/server/agents/care/careGuardrailAgent";
import { runCareIntakeAgent } from "@/server/agents/care/careIntakeAgent";
import { runCarePlanExplainer } from "@/server/agents/care/carePlanExplainer";
import { runCareTaskTransformer } from "@/server/agents/care/careTaskTransformer";
import type {
  AgentDecisionRecord,
  CareSupportTransformInput,
  CareSupportTransformOutput,
  SupportJourneyPatch,
} from "@/server/agents/care/types";
import {
  PIPELINE_VERSION,
  PIPELINE_VERSION_LLM,
} from "@/server/agents/care/types";
import { runWorkerCapabilityAgent } from "@/server/agents/care/workerCapabilityAgent";

function hashInput(input: CareSupportTransformInput): string {
  const payload = {
    sessionId: input.sessionId,
    participantId: input.participantId ?? null,
    messageLength: input.message.length,
    messageHash: createHash("sha256")
      .update(input.message, "utf8")
      .digest("hex")
      .slice(0, 16),
    assessmentKeys: Object.keys(input.assessmentSignals).sort(),
    preferenceKeys: Object.keys(input.preferences).sort(),
  };
  return createHash("sha256")
    .update(JSON.stringify(payload), "utf8")
    .digest("hex");
}

function buildSupportJourneyPatch(params: {
  sessionId: string;
  humanReviewRequired: boolean;
  pendingConfirmationGate: string;
}): SupportJourneyPatch {
  const nodes: SupportJourneyPatch["nodes"] = [
    {
      id: "intake",
      type: "intake",
      label: "Understand your request",
      status: "complete",
    },
    {
      id: "plan_draft",
      type: "plan_draft",
      label: "Care plan draft",
      status: "complete",
    },
    {
      id: "capability_review",
      type: "capability_review",
      label: "Capability review",
      status: "complete",
    },
    {
      id: "participant_confirmation",
      type: "participant_confirmation",
      label: "Your confirmation",
      status: "pending",
    },
  ];

  if (params.humanReviewRequired) {
    nodes.push({
      id: "human_review",
      type: "human_review",
      label: "Staff safety review",
      status: "pending",
    });
  }

  nodes.push({
    id: "booking_gate",
    type: "booking_gate",
    label: "Booking",
    status: "blocked",
  });

  const edges: SupportJourneyPatch["edges"] = [
    { from: "intake", to: "plan_draft" },
    { from: "plan_draft", to: "capability_review" },
    { from: "capability_review", to: "participant_confirmation" },
  ];

  if (params.humanReviewRequired) {
    edges.push(
      { from: "participant_confirmation", to: "human_review" },
      { from: "human_review", to: "booking_gate" },
    );
  } else {
    edges.push({ from: "participant_confirmation", to: "booking_gate" });
  }

  return {
    version: 1,
    sessionId: params.sessionId,
    nodes,
    edges,
    pendingConfirmationGate: params.pendingConfirmationGate,
  };
}

function pushDecision(
  agentDecisions: AgentDecisionRecord[],
  agent: string,
  outcome: string,
  meta: CareLlmStepMeta,
  extra?: Record<string, unknown>,
): void {
  agentDecisions.push({
    agent,
    outcome,
    source: meta.source,
    metadata: {
      confidence: meta.confidence,
      fallbackUsed: meta.fallbackUsed,
      llmProvider: meta.llmProvider,
      ...extra,
    },
  });
}

/** Synchronous rules-only transform (backward compatible for tests). */
export function transformCareSupport(
  input: CareSupportTransformInput,
): CareSupportTransformOutput {
  const transformId = randomUUID();
  const agentDecisions: AgentDecisionRecord[] = [];

  const intake = runCareIntakeAgent(input);
  agentDecisions.push({
    agent: "careIntakeAgent",
    outcome: "intake_complete",
    source: "rules",
    metadata: {
      requestType: intake.inferredRequestType,
      riskSignalCount: intake.riskSignals.length,
    },
  });

  let carePlanDraft = runCareTaskTransformer(input, intake);
  agentDecisions.push({
    agent: "careTaskTransformer",
    outcome: "draft_structured",
    source: "rules",
    metadata: { taskCount: carePlanDraft.tasks.length },
  });

  const requiredCapabilities = runWorkerCapabilityAgent(intake, carePlanDraft);
  agentDecisions.push({
    agent: "workerCapabilityAgent",
    outcome: "capabilities_derived",
    source: "rules",
    metadata: { count: requiredCapabilities.length },
  });

  const sessionOnly = !input.participantId;
  const guardrail = runCareGuardrailAgent({
    intake,
    carePlanDraft,
    requiredCapabilities,
    participantId: input.participantId,
    preferences: input.preferences,
    sessionOnly,
  });
  carePlanDraft = guardrail.carePlanDraft;

  agentDecisions.push({
    agent: "careGuardrailAgent",
    outcome: guardrail.guardrailDecision.allowed
      ? "guardrails_applied"
      : "guardrails_blocked",
    source: "rules",
    metadata: {
      humanReviewRequired: guardrail.guardrailDecision.humanReviewRequired,
      rules: guardrail.guardrailDecision.appliedRules,
    },
  });

  const participantFacingSummary = runCarePlanExplainer({
    intake,
    carePlanDraft,
    guardrail,
    requiredCapabilities,
  });

  agentDecisions.push({
    agent: "carePlanExplainer",
    outcome: "summary_generated",
    source: "rules",
  });

  const primaryCheckpoint =
    guardrail.checkpoints.find((c) => c.requiredBeforeBooking)?.id ??
    "participant_confirm_plan_draft";

  const supportJourneyPatch = buildSupportJourneyPatch({
    sessionId: input.sessionId,
    humanReviewRequired: guardrail.guardrailDecision.humanReviewRequired,
    pendingConfirmationGate: primaryCheckpoint,
  });

  const audit = {
    sessionId: input.sessionId,
    transformId,
    timestamp: new Date().toISOString(),
    pipelineVersion: PIPELINE_VERSION,
    participantId: input.participantId ?? null,
    inputHash: hashInput(input),
    agentDecisions,
    guardrailTriggers: guardrail.auditTriggers,
    redactedFields: guardrail.redactedFields,
    llm: { enabled: false },
  };

  return {
    participantFacingSummary,
    carePlanDraft,
    supportJourneyPatch,
    requiredCapabilities,
    missingInformation: guardrail.missingInformation,
    guardrailDecision: guardrail.guardrailDecision,
    checkpoints: guardrail.checkpoints,
    audit,
  };
}

/** Async transform with optional Care and Support LLM steps. */
export async function transformCareSupportAsync(
  input: CareSupportTransformInput,
): Promise<CareSupportTransformOutput> {
  if (!isCareAgentLlmEnabled()) {
    return transformCareSupport(input);
  }

  const transformId = randomUUID();
  const agentDecisions: AgentDecisionRecord[] = [];
  let anyFallback = false;
  let llmProvider: string | undefined;
  let minConfidence: number | undefined;

  const intakeStep = await runCareIntakeWithLlm(input);
  const intake = intakeStep.intake;
  if (intakeStep.meta.fallbackUsed) anyFallback = true;
  if (intakeStep.meta.llmProvider) llmProvider = intakeStep.meta.llmProvider;
  if (intakeStep.meta.confidence != null) {
    minConfidence =
      minConfidence == null
        ? intakeStep.meta.confidence
        : Math.min(minConfidence, intakeStep.meta.confidence);
  }
  pushDecision(agentDecisions, "careIntakeAgent", "intake_complete", intakeStep.meta, {
    requestType: intake.inferredRequestType,
    riskSignalCount: intake.riskSignals.length,
  });

  const taskStep = await runCareTaskTransformerWithLlm(input, intake);
  let carePlanDraft = taskStep.carePlanDraft;
  if (taskStep.meta.fallbackUsed) anyFallback = true;
  if (taskStep.meta.llmProvider) llmProvider = taskStep.meta.llmProvider;
  if (taskStep.meta.confidence != null) {
    minConfidence =
      minConfidence == null
        ? taskStep.meta.confidence
        : Math.min(minConfidence, taskStep.meta.confidence);
  }
  pushDecision(agentDecisions, "careTaskTransformer", "draft_structured", taskStep.meta, {
    taskCount: carePlanDraft.tasks.length,
  });

  const capabilityStep = await runWorkerCapabilityWithLlm(intake, carePlanDraft);
  const requiredCapabilities = capabilityStep.requiredCapabilities;
  if (capabilityStep.meta.fallbackUsed) anyFallback = true;
  if (capabilityStep.meta.llmProvider) llmProvider = capabilityStep.meta.llmProvider;
  if (capabilityStep.meta.confidence != null) {
    minConfidence =
      minConfidence == null
        ? capabilityStep.meta.confidence
        : Math.min(minConfidence, capabilityStep.meta.confidence);
  }
  pushDecision(
    agentDecisions,
    "workerCapabilityAgent",
    "capabilities_derived",
    capabilityStep.meta,
    { count: requiredCapabilities.length },
  );

  const sessionOnly = !input.participantId;
  const guardrail = runCareGuardrailAgent({
    intake,
    carePlanDraft,
    requiredCapabilities,
    participantId: input.participantId,
    preferences: input.preferences,
    sessionOnly,
  });
  carePlanDraft = guardrail.carePlanDraft;

  agentDecisions.push({
    agent: "careGuardrailAgent",
    outcome: guardrail.guardrailDecision.allowed
      ? "guardrails_applied"
      : "guardrails_blocked",
    source: "rules",
    metadata: {
      humanReviewRequired: guardrail.guardrailDecision.humanReviewRequired,
      rules: guardrail.guardrailDecision.appliedRules,
    },
  });

  const explainerStep = await runCarePlanExplainerWithLlm({
    intake,
    carePlanDraft,
    guardrail,
    requiredCapabilities,
  });
  if (explainerStep.meta.fallbackUsed) anyFallback = true;
  if (explainerStep.meta.llmProvider) llmProvider = explainerStep.meta.llmProvider;
  if (explainerStep.meta.confidence != null) {
    minConfidence =
      minConfidence == null
        ? explainerStep.meta.confidence
        : Math.min(minConfidence, explainerStep.meta.confidence);
  }
  pushDecision(agentDecisions, "carePlanExplainer", "summary_generated", explainerStep.meta);

  const primaryCheckpoint =
    guardrail.checkpoints.find((c) => c.requiredBeforeBooking)?.id ??
    "participant_confirm_plan_draft";

  const supportJourneyPatch = buildSupportJourneyPatch({
    sessionId: input.sessionId,
    humanReviewRequired: guardrail.guardrailDecision.humanReviewRequired,
    pendingConfirmationGate: primaryCheckpoint,
  });

  const audit = {
    sessionId: input.sessionId,
    transformId,
    timestamp: new Date().toISOString(),
    pipelineVersion: PIPELINE_VERSION_LLM,
    participantId: input.participantId ?? null,
    inputHash: hashInput(input),
    agentDecisions,
    guardrailTriggers: guardrail.auditTriggers,
    redactedFields: guardrail.redactedFields,
    llm: {
      enabled: true,
      provider: llmProvider,
      fallbackUsed: anyFallback,
      minConfidence,
    },
  };

  return {
    participantFacingSummary: explainerStep.summary,
    carePlanDraft,
    supportJourneyPatch,
    requiredCapabilities,
    missingInformation: guardrail.missingInformation,
    guardrailDecision: guardrail.guardrailDecision,
    checkpoints: guardrail.checkpoints,
    audit,
  };
}
