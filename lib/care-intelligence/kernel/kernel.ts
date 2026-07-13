import type { CareIntelligenceConfig } from "@/lib/care-intelligence/config";
import { runCareIntelligence } from "@/lib/care-intelligence/engine";
import {
  appendKernelAuditEvent,
  verifyKernelAudit,
} from "@/lib/care-intelligence/kernel/audit";
import {
  CSI_KERNEL_CAPABILITIES,
  validateCapabilityRegistry,
} from "@/lib/care-intelligence/kernel/capabilities";
import type {
  CsiAgiKernelRun,
  KernelBelief,
  KernelCapability,
  KernelCapabilityInvocation,
  KernelCommitment,
  KernelGoal,
  KernelInvariantResult,
  KernelPhase,
} from "@/lib/care-intelligence/kernel/types";
import type { CoordinationScenario } from "@/lib/care-intelligence/types";

export const CSI_AGI_KERNEL_VERSION = "0.2.0-research";

export function runCsiAgiKernel(
  scenario: CoordinationScenario,
  config: CareIntelligenceConfig,
  options: {
    now?: Date;
    capabilities?: readonly KernelCapability[];
  } = {},
): CsiAgiKernelRun {
  const now = options.now ?? new Date();
  const capabilities = options.capabilities ?? CSI_KERNEL_CAPABILITIES;
  validateCapabilityRegistry(capabilities);

  const audit: CsiAgiKernelRun["audit"] = [];
  const invocations: KernelCapabilityInvocation[] = [];
  const record = (
    phase: KernelPhase,
    kind: CsiAgiKernelRun["audit"][number]["kind"],
    summary: string,
  ) =>
    appendKernelAuditEvent({
      events: audit,
      baseTime: now,
      phase,
      kind,
      summary,
    });
  const invoke = (
    capabilityId: string,
    phase: KernelPhase,
    outcome: KernelCapabilityInvocation["outcome"],
    summary: string,
  ) =>
    invocations.push({
      sequence: invocations.length + 1,
      capabilityId,
      phase,
      outcome,
      summary,
    });

  record(
    "boot",
    "kernel_started",
    `CSI-AGI kernel ${CSI_AGI_KERNEL_VERSION} started for a synthetic scenario.`,
  );
  record(
    "boot",
    "boundary_checked",
    `${capabilities.length} participant-scoped, side-effect-free capabilities validated.`,
  );
  invoke(
    "append_tamper_evident_audit",
    "boot",
    "completed",
    "Started an in-memory hash-chained audit.",
  );

  const coordination = runCareIntelligence(scenario, config, { now });
  const authorityStopped =
    scenario.participantStop ||
    coordination.policy.ruleIds.includes("CSI-MANDATE-INACTIVE-01");
  const candidatesRead = coordination.evidence.some(
    (evidence) => evidence.sourceType === "candidate",
  );

  invoke(
    "read_synthetic_world",
    "perceive",
    "completed",
    candidatesRead
      ? "Read the authorised synthetic world and filtered candidate evidence."
      : "Read only the synthetic event and authority envelope; candidates were not needed.",
  );
  record(
    "perceive",
    "perception_recorded",
    `${coordination.evidence.length} inspectable evidence record(s) entered working memory.`,
  );

  invoke(
    "validate_participant_authority",
    "orient",
    authorityStopped ? "blocked" : "completed",
    authorityStopped
      ? "Participant authority stopped the cognitive cycle."
      : `Authority permits deliberation up to level ${coordination.policy.autonomyLevel}.`,
  );
  record(
    "orient",
    "authority_oriented",
    authorityStopped
      ? "Participant stop or inactive mandate dominates all other goals."
      : `${scenario.world.goals.length} participant-defined goal(s) oriented the cycle.`,
  );

  const specialistsReached = coordination.specialistObservations.some(
    (observation) => observation.status !== "not_reached",
  );
  invoke(
    "consult_bounded_specialists",
    "deliberate",
    specialistsReached && !authorityStopped ? "completed" : "skipped",
    specialistsReached && !authorityStopped
      ? "Collected evidence-backed rights, continuity, accessibility, journey and budget summaries."
      : "Specialist comparison was skipped after the authority or relevance gate.",
  );
  record(
    "deliberate",
    "specialists_consulted",
    `${coordination.specialistObservations.filter((item) => item.status !== "not_reached").length} specialist observation(s) were reached.`,
  );

  const simulationReached = coordination.deliberationGraph.some(
    (node) => node.stage === "simulate" && node.status === "passed",
  );
  invoke(
    "simulate_counterfactual_plans",
    "simulate",
    simulationReached ? "completed" : "skipped",
    simulationReached
      ? `${coordination.plans.length} policy-visible plan(s) retained after complete consequence simulation.`
      : "Counterfactual simulation produced no policy-visible plan.",
  );
  record(
    "simulate",
    "counterfactuals_simulated",
    `${coordination.plans.length} bounded plan(s) are available to the participant.`,
  );

  invoke(
    "arbitrate_locked_policy",
    "arbitrate",
    "completed",
    `Locked policy returned ${coordination.decision}; specialist output could not change its rules.`,
  );
  record(
    "arbitrate",
    "policy_arbitrated",
    `${coordination.policy.ruleIds.length} deterministic policy rule(s) support the ${coordination.decision} outcome.`,
  );

  const commitments: KernelCommitment[] = coordination.actionIntents.map(
    (intent) => ({
      id: `commitment-${intent.id}`,
      planId: intent.planId,
      kind: intent.action,
      state: "awaiting_participant_confirmation",
      executionAllowed: false,
      expiresAt: intent.expiresAt,
    }),
  );
  invoke(
    "prepare_non_executable_intents",
    "commit",
    commitments.length > 0
      ? "completed"
      : authorityStopped
        ? "blocked"
        : "skipped",
    commitments.length > 0
      ? `${commitments.length} expiring, non-executable commitment(s) await participant confirmation.`
      : "No commitment was prepared for this policy outcome.",
  );
  record(
    "commit",
    "commitments_prepared",
    `${commitments.length} non-executable commitment(s) prepared; zero actions performed.`,
  );

  invoke(
    "explain_with_evidence",
    "commit",
    "completed",
    "Prepared a concise result, policy record and resolvable evidence references.",
  );

  const goals = buildGoals(scenario, coordination.decision);
  const beliefs = buildBeliefs(coordination);
  const invariants = evaluateInvariants({
    scenario,
    config,
    capabilities,
    coordination,
    commitments,
    beliefs,
    cyclesCompleted: 1,
  });
  const invariantFailure = invariants.find((invariant) => !invariant.passed);
  const phase = authorityStopped || invariantFailure ? "halted" : "completed";
  const haltReason = invariantFailure
    ? `KERNEL_INVARIANT_FAILED:${invariantFailure.id}`
    : scenario.participantStop
      ? "PARTICIPANT_STOP"
      : authorityStopped
        ? "PARTICIPANT_AUTHORITY_INACTIVE"
        : null;
  record(
    phase,
    phase === "halted" ? "kernel_halted" : "kernel_completed",
    phase === "halted"
      ? `Kernel halted: ${haltReason}.`
      : `Kernel completed one bounded cognitive cycle with decision ${coordination.decision}.`,
  );
  const auditVerification = verifyKernelAudit(audit);

  return {
    kernelRunId: `csi-kernel-${scenario.id}-${now.getTime()}`,
    kernelVersion: CSI_AGI_KERNEL_VERSION,
    scenarioId: scenario.id,
    phase,
    haltReason,
    cyclesCompleted: 1,
    maxCycles: config.maxCycles,
    decision: coordination.decision,
    goals,
    beliefs,
    evidence: coordination.evidence,
    capabilityRegistry: [...capabilities],
    capabilityInvocations: invocations,
    commitments: invariantFailure ? [] : commitments,
    metacognition: buildMetacognition(coordination),
    invariants,
    audit,
    auditVerification,
    coordination,
    boundaries: {
      syntheticDataOnly: true,
      sideEffectCapabilities: 0,
      externalNetworkCapabilities: 0,
      persistentWriteCapabilities: 0,
      executionAttempts: 0,
      cyclesBounded: true,
      commitmentsBounded: true,
      policySelfModificationAllowed: false,
    },
  };
}

function buildGoals(
  scenario: CoordinationScenario,
  decision: CsiAgiKernelRun["decision"],
): KernelGoal[] {
  const order = { essential: 0, important: 1, preferred: 2 } as const;
  return scenario.world.goals
    .map((goal) => ({
      id: `kernel-${goal.id}`,
      statement: goal.statement,
      priority: goal.priority,
      sourceGoalId: goal.id,
      status:
        decision === "blocked" || decision === "refuse"
          ? ("blocked" as const)
          : ("active" as const),
    }))
    .sort((a, b) => order[a.priority] - order[b.priority]);
}

function buildBeliefs(
  coordination: CsiAgiKernelRun["coordination"],
): KernelBelief[] {
  const beliefs: KernelBelief[] = [
    {
      id: "belief-observed-event",
      proposition: `The current synthetic event is ${coordination.scenarioId}.`,
      confidence: 1,
      evidenceIds: ["evidence-event"],
      status: "asserted",
    },
    {
      id: "belief-authority-policy",
      proposition: `Locked policy returned ${coordination.decision}.`,
      confidence: 1,
      evidenceIds: ["evidence-mandate"],
      status: "asserted",
    },
  ];
  if (coordination.plans[0])
    beliefs.push({
      id: "belief-leading-plan",
      proposition: `Plan ${coordination.plans[0].id} currently has the strongest bounded goal fit.`,
      confidence: Math.max(
        0,
        1 - coordination.plans[0].counterfactual.uncertainty,
      ),
      evidenceIds: coordination.specialistObservations
        .flatMap((observation) => observation.evidenceIds)
        .filter((id, index, values) => values.indexOf(id) === index),
      status:
        coordination.plans[0].counterfactual.uncertainty <= 0.25
          ? "asserted"
          : "uncertain",
    });
  if (coordination.agentDisagreement.present)
    beliefs.push({
      id: "belief-specialist-disagreement",
      proposition: coordination.agentDisagreement.summary,
      confidence: 1,
      evidenceIds: ["evidence-continuity", "evidence-event"],
      status: "asserted",
    });
  return beliefs;
}

function buildMetacognition(
  coordination: CsiAgiKernelRun["coordination"],
): CsiAgiKernelRun["metacognition"] {
  const referencedEvidence = new Set(
    coordination.specialistObservations.flatMap(
      (observation) => observation.evidenceIds,
    ),
  );
  const evidenceCoverage =
    coordination.evidence.length > 0
      ? referencedEvidence.size / coordination.evidence.length
      : 1;
  const topPlan = coordination.plans[0];
  const calibratedConfidence = topPlan
    ? Math.max(0, 1 - topPlan.counterfactual.uncertainty)
    : coordination.decision === "monitor" ||
        coordination.decision === "blocked" ||
        coordination.decision === "refuse"
      ? 1
      : 0.8;
  const unresolvedUncertainties = [
    ...(coordination.agentDisagreement.present
      ? [coordination.agentDisagreement.summary]
      : []),
    ...(topPlan && topPlan.counterfactual.uncertainty > 0.25
      ? ["The leading plan has material simulated uncertainty."]
      : []),
  ];
  const humanReviewRequired =
    coordination.decision !== "monitor" ||
    coordination.agentDisagreement.present;
  return {
    calibratedConfidence: Math.round(calibratedConfidence * 100) / 100,
    evidenceCoverage: Math.round(Math.min(1, evidenceCoverage) * 100) / 100,
    unresolvedUncertainties,
    specialistDisagreement: coordination.agentDisagreement.present,
    humanReviewRequired,
    humanReviewReason: coordination.agentDisagreement.present
      ? "The participant must resolve a meaningful specialist trade-off."
      : humanReviewRequired
        ? "The policy outcome requires participant or authorised-human review."
        : "No intervention is proposed; the journey remains under monitoring.",
    selfModificationAttempted: false,
  };
}

function evaluateInvariants(params: {
  scenario: CoordinationScenario;
  config: CareIntelligenceConfig;
  capabilities: readonly KernelCapability[];
  coordination: CsiAgiKernelRun["coordination"];
  commitments: readonly KernelCommitment[];
  beliefs: readonly KernelBelief[];
  cyclesCompleted: number;
}): KernelInvariantResult[] {
  const evidenceIds = new Set(
    params.coordination.evidence.map((evidence) => evidence.id),
  );
  const allEvidenceResolves =
    params.beliefs.every((belief) =>
      belief.evidenceIds.every((id) => evidenceIds.has(id)),
    ) &&
    params.coordination.specialistObservations.every((observation) =>
      observation.evidenceIds.every((id) => evidenceIds.has(id)),
    );
  const participantStopDominates = !params.scenario.participantStop
    ? true
    : params.coordination.decision === "blocked" &&
      params.commitments.length === 0 &&
      params.coordination.worldStateSummary.memoryEventsRead === 0;
  return [
    invariant(
      "synthetic_data_only",
      params.scenario.synthetic && params.config.syntheticOnly,
      "Kernel input and runtime are synthetic-only.",
    ),
    invariant(
      "participant_stop_dominates",
      participantStopDominates,
      "Participant stop overrides goals, specialists and commitments.",
    ),
    invariant(
      "no_execution_capability",
      params.capabilities.every((capability) => !capability.sideEffects),
      "No registered capability can cause a real-world side effect.",
    ),
    invariant(
      "no_external_model_capability",
      params.capabilities.every((capability) => !capability.externalNetwork),
      "No registered capability can call an external model or network.",
    ),
    invariant(
      "no_persistent_memory",
      params.capabilities.every((capability) => !capability.persistentWrite) &&
        params.coordination.boundaries.persistentMemoryWrites === 0,
      "Working memory is in-process and cannot persist.",
    ),
    invariant(
      "policy_separate_from_specialists",
      params.coordination.deliberationGraph.some(
        (node) => node.stage === "policy",
      ),
      "Specialist summaries and deterministic policy are separate stages.",
    ),
    invariant(
      "bounded_cycles",
      params.cyclesCompleted <= params.config.maxCycles,
      `Cycle count ${params.cyclesCompleted}/${params.config.maxCycles}.`,
    ),
    invariant(
      "bounded_commitments",
      params.commitments.length <= params.config.maxPlans,
      `Commitment count ${params.commitments.length}/${params.config.maxPlans}.`,
    ),
    invariant(
      "evidence_references_resolve",
      allEvidenceResolves,
      "Every belief and specialist evidence reference resolves.",
    ),
  ];
}

function invariant(
  id: KernelInvariantResult["id"],
  passed: boolean,
  detail: string,
): KernelInvariantResult {
  return { id, passed, detail };
}
