import {
  assertSyntheticBoundary,
  type CareIntelligenceConfig,
} from "@/lib/care-intelligence/config";
import { containsUntrustedInstruction } from "@/lib/care-intelligence/content-firewall";
import {
  eligibleVehicles,
  eligibleWorkers,
  simulateRecoveryPlans,
} from "@/lib/care-intelligence/counterfactual";
import { decidePolicy } from "@/lib/care-intelligence/policy";
import {
  buildEvidence,
  describeAgentDisagreement,
  runSpecialists,
} from "@/lib/care-intelligence/specialists";
import type {
  ActionIntent,
  CoordinationRun,
  CoordinationScenario,
  DeliberationNode,
  Disruption,
  MandateAction,
  RecoveryPlan,
} from "@/lib/care-intelligence/types";

export function runCareIntelligence(
  scenario: CoordinationScenario,
  config: CareIntelligenceConfig,
  options: { now?: Date } = {},
): CoordinationRun {
  assertSyntheticBoundary(config);
  if (scenario.synthetic !== true)
    throw new Error("NON_SYNTHETIC_INPUT_BLOCKED");

  const now = options.now ?? new Date();
  const mandateActive = isMandateActive(scenario, now);
  const missingFields = missingJourneyFields(scenario);
  const mandateAction = actionForDisruption(scenario.journey.disruption);
  const mandateAllowsAction = Boolean(
    mandateAction &&
    scenario.world.mandate.allowedActions.includes(mandateAction),
  );
  const consentPresent = [
    "read_synthetic_journey",
    "compare_synthetic_candidates",
    "prepare_recovery_options",
  ].every((scope) => scenario.world.consentScopes.includes(scope));
  const candidateAccessAllowed =
    scenario.requestKind === "coordinate_support" &&
    !scenario.participantStop &&
    mandateActive &&
    consentPresent &&
    missingFields.length === 0 &&
    Boolean(mandateAction) &&
    mandateAllowsAction &&
    scenario.journey.disruption !== "none" &&
    scenario.journey.disruption !== "vehicle_delay";

  const needsWorker =
    scenario.journey.disruption === "worker_cancelled" ||
    scenario.journey.disruption === "linked_cancellation";
  const needsVehicle =
    scenario.journey.disruption === "vehicle_cancelled" ||
    scenario.journey.disruption === "linked_cancellation";
  const filteredCandidateIds: string[] = [];
  const safeWorkers =
    candidateAccessAllowed && needsWorker
      ? scenario.workerCandidates.filter((candidate) => {
          const blocked = containsUntrustedInstruction(candidate.untrustedText);
          if (blocked) filteredCandidateIds.push(candidate.id);
          return !blocked;
        })
      : [];
  const safeVehicles =
    candidateAccessAllowed && needsVehicle
      ? scenario.vehicleCandidates.filter((candidate) => {
          const blocked = containsUntrustedInstruction(candidate.untrustedText);
          if (blocked) filteredCandidateIds.push(candidate.id);
          return !blocked;
        })
      : [];
  const workers = candidateAccessAllowed
    ? eligibleWorkers({ world: scenario.world, candidates: safeWorkers })
    : [];
  const vehicles = candidateAccessAllowed
    ? eligibleVehicles({ world: scenario.world, candidates: safeVehicles })
    : [];

  const delayPlanningAllowed =
    scenario.requestKind === "coordinate_support" &&
    !scenario.participantStop &&
    mandateActive &&
    consentPresent &&
    missingFields.length === 0 &&
    scenario.journey.disruption === "vehicle_delay" &&
    mandateAllowsAction;
  const candidatePlans =
    candidateAccessAllowed || delayPlanningAllowed
      ? simulateRecoveryPlans({
          world: scenario.world,
          journey: scenario.journey,
          workers,
          vehicles,
        })
      : [];
  const evidence = buildEvidence(
    scenario,
    safeWorkers.map((candidate) => candidate.id),
    safeVehicles.map((candidate) => candidate.id),
    candidateAccessAllowed,
  );
  const specialistObservations = runSpecialists({
    scenario,
    plans: candidatePlans,
    candidateAccessAllowed,
  });
  const policy = decidePolicy({
    requestKind: scenario.requestKind,
    participantStop: scenario.participantStop,
    mandateActive,
    consentPresent,
    mandateAction,
    mandateAllowsAction,
    autonomyLevel: Math.min(
      scenario.world.mandate.autonomyLevel,
      config.autonomyCeiling,
    ) as 0 | 1 | 2 | 3,
    missingFields,
    disruption: scenario.journey.disruption,
    delayWithinMandate:
      scenario.journey.delayMinutes <=
      scenario.world.mandate.maxTimeShiftMinutes,
    planCount: candidatePlans.length,
    familiarWorkerPlanAvailable: candidatePlans.some(
      (plan) => plan.worker?.familiarToParticipant,
    ),
    untrustedContentRemoved: filteredCandidateIds.length > 0,
    safeguardContext: scenario.safeguardContext,
  });

  const visibleCandidatePlans =
    policy.decision === "propose"
      ? candidatePlans.slice(0, config.maxPlans)
      : [];
  const plans: RecoveryPlan[] = visibleCandidatePlans.map((plan, index) => ({
    id: plan.id,
    rank: index + 1,
    worker: plan.worker
      ? { id: plan.worker.id, displayName: plan.worker.displayName }
      : null,
    vehicle: plan.vehicle
      ? { id: plan.vehicle.id, displayName: plan.vehicle.displayName }
      : null,
    counterfactual: plan.outcome,
    supportedByAgents: supportedAgents(plan),
    concerns: [
      ...(plan.worker && !plan.worker.familiarToParticipant
        ? ["Introduces an unfamiliar worker."]
        : []),
      ...(plan.outcome.timeShiftMinutes > 15
        ? ["Changes the planned time by more than 15 minutes."]
        : []),
    ],
  }));
  const actionIntents =
    policy.decision === "propose" && mandateAction
      ? plans.map((plan, index) =>
          buildIntent(
            mandateAction,
            plan.id,
            index,
            now,
            scenario.world.mandate.endsAt,
          ),
        )
      : [];
  const disagreement = describeAgentDisagreement(scenario, candidatePlans);

  return {
    runId: `csi-sim-${scenario.id}-${now.getTime()}`,
    scenarioId: scenario.id,
    generatedAt: now.toISOString(),
    decision: policy.decision,
    participantMessage: participantMessage(policy.decision, plans.length),
    worldStateSummary: {
      activeGoals: scenario.world.goals.length,
      explicitPreferences:
        scenario.world.requiredAccessFeatures.length +
        scenario.world.requiredSupportTags.length +
        2,
      memoryEventsRead: candidateAccessAllowed
        ? scenario.world.episodicMemory.length
        : 0,
      memoryEventsWritten: 0,
    },
    evidence,
    specialistObservations,
    plans,
    policy,
    actionIntents,
    deliberationGraph: buildGraph({
      scenario,
      mandateActive,
      candidateAccessAllowed,
      missingFields,
      filteredCount: filteredCandidateIds.length,
      candidatePlanCount: candidatePlans.length,
      visiblePlanCount: plans.length,
      decision: policy.decision,
    }),
    agentDisagreement: disagreement,
    filteredCandidateIds,
    boundaries: {
      syntheticDataOnly: true,
      realWorldActions: 0,
      externalMessages: 0,
      externalModelCalls: 0,
      persistentMemoryWrites: 0,
      participantCanStop: true,
      mandateRevocable: true,
      participantConfirmationRequired: true,
      selfModificationAllowed: false,
    },
  };
}

function isMandateActive(scenario: CoordinationScenario, now: Date) {
  const { mandate } = scenario.world;
  if (mandate.status !== "active") return false;
  const startsAt = Date.parse(mandate.startsAt);
  const endsAt = Date.parse(mandate.endsAt);
  return (
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    startsAt <= now.getTime() &&
    endsAt > now.getTime()
  );
}

function missingJourneyFields(scenario: CoordinationScenario) {
  const missing: string[] = [];
  if (!scenario.journey.appointmentStart) missing.push("appointment time");
  if (!scenario.journey.pickupSuburb) missing.push("pickup suburb");
  if (!scenario.journey.destination) missing.push("destination");
  if (!scenario.journey.goal.trim()) missing.push("participant goal");
  return missing;
}

export function actionForDisruption(
  disruption: Disruption,
): MandateAction | null {
  switch (disruption) {
    case "worker_cancelled":
      return "prepare_worker_replacement";
    case "vehicle_cancelled":
      return "prepare_transport_replacement";
    case "linked_cancellation":
      return "prepare_linked_recovery";
    case "vehicle_delay":
      return "prepare_delay_notice";
    case "none":
      return null;
  }
}

function supportedAgents(plan: {
  worker: { familiarToParticipant: boolean } | null;
  vehicle: unknown;
}) {
  return [
    "rights" as const,
    "journey" as const,
    "budget" as const,
    ...(plan.worker?.familiarToParticipant ? (["continuity"] as const) : []),
    ...(plan.vehicle ? (["accessibility"] as const) : []),
  ];
}

function buildIntent(
  action: MandateAction,
  planId: string,
  index: number,
  now: Date,
  mandateEndsAt: string,
): ActionIntent {
  const fifteenMinutes = now.getTime() + 15 * 60 * 1000;
  const mandateExpiry = Date.parse(mandateEndsAt);
  const expiresAt = new Date(
    Math.min(
      fifteenMinutes,
      Number.isFinite(mandateExpiry) ? mandateExpiry : fifteenMinutes,
    ),
  );
  return {
    id: `intent-${index + 1}`,
    action,
    planId,
    state: "awaiting_participant_confirmation",
    executionAllowed: false,
    participantConfirmationRequired: true,
    externalTool: null,
    expiresAt: expiresAt.toISOString(),
  };
}

function participantMessage(
  decision: CoordinationRun["decision"],
  planCount: number,
) {
  switch (decision) {
    case "monitor":
      return "Your synthetic support journey is stable. I did not prepare or execute any change.";
    case "propose":
      return `I compared complete care and transport consequences and prepared ${planCount} synthetic option${planCount === 1 ? "" : "s"}. Nothing has been booked or sent. You decide.`;
    case "clarify":
      return "I need a required journey detail before comparing alternatives. Nothing has been shared or changed.";
    case "escalate":
      return "I could not prepare a safe option inside your authority. A participant-authorised person should review this scenario.";
    case "refuse":
      return "I cannot make that kind of decision. It remains with an appropriately qualified person.";
    case "blocked":
      return "Coordination is stopped because participant authority is not active.";
  }
}

function buildGraph(params: {
  scenario: CoordinationScenario;
  mandateActive: boolean;
  candidateAccessAllowed: boolean;
  missingFields: string[];
  filteredCount: number;
  candidatePlanCount: number;
  visiblePlanCount: number;
  decision: CoordinationRun["decision"];
}): DeliberationNode[] {
  return [
    {
      id: "node-boundary",
      stage: "boundary",
      status: "passed",
      label: "Synthetic boundary",
      summary:
        "No execution, messaging, external model or memory-write port exists.",
      evidenceIds: [],
    },
    {
      id: "node-authority",
      stage: "authority",
      status:
        params.mandateActive && !params.scenario.participantStop
          ? "passed"
          : "blocked",
      label: "Participant authority",
      summary: params.scenario.participantStop
        ? "Participant stop is active."
        : params.mandateActive
          ? "Revocable mandate is active."
          : "Mandate is inactive.",
      evidenceIds: ["evidence-mandate"],
    },
    {
      id: "node-observe",
      stage: "observe",
      status: params.missingFields.length
        ? "needs_input"
        : params.candidateAccessAllowed ||
            params.scenario.journey.disruption === "vehicle_delay" ||
            params.scenario.journey.disruption === "none"
          ? "passed"
          : "not_reached",
      label: "Bounded observation",
      summary: params.candidateAccessAllowed
        ? `${params.filteredCount} instruction-like candidate record(s) excluded.`
        : "Candidate access was unnecessary or stopped by an earlier gate.",
      evidenceIds: ["evidence-event"],
    },
    {
      id: "node-specialists",
      stage: "specialists",
      status: params.candidateAccessAllowed ? "passed" : "not_reached",
      label: "Specialist deliberation",
      summary: params.candidateAccessAllowed
        ? "Rights, continuity, accessibility, journey and budget specialists compared evidence."
        : "Specialist candidate comparison was not reached.",
      evidenceIds: params.candidateAccessAllowed
        ? ["evidence-mandate", "evidence-access", "evidence-continuity"]
        : [],
    },
    {
      id: "node-simulate",
      stage: "simulate",
      status: params.candidatePlanCount > 0 ? "passed" : "not_reached",
      label: "Counterfactual simulation",
      summary: `${params.candidatePlanCount} complete synthetic consequence set(s) passed hard limits.`,
      evidenceIds: [],
    },
    {
      id: "node-policy",
      stage: "policy",
      status:
        params.decision === "propose" || params.decision === "monitor"
          ? "passed"
          : params.decision === "clarify"
            ? "needs_input"
            : "blocked",
      label: "Locked policy",
      summary: `Policy returned ${params.decision}; ${params.visiblePlanCount} plan(s) exposed.`,
      evidenceIds: ["evidence-mandate"],
    },
    {
      id: "node-control",
      stage: "participant_control",
      status: "passed",
      label: "Participant control",
      summary:
        "Confirm, change, reject and stop remain available; execution is disabled.",
      evidenceIds: ["evidence-mandate"],
    },
  ];
}
