import { randomUUID } from "node:crypto";

import { prepareKernelProposalFromMission } from "@/lib/ai/platform/actions/executor";
import { enqueueHumanOpsReview } from "@/lib/ai/platform/human-operations";
import {
  getMissionPlan,
  saveMissionPlan,
} from "@/lib/ai/platform/missions/store";
import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";
import { isActionKernelOperational } from "@/lib/config/action-kernel";
import { adaptiveRecoveryConfig } from "@/lib/config/adaptive-recovery";
import { agenticNerveCentreConfig } from "@/lib/config/agentic-nerve-centre";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";

import { generateRecoveryAlternatives } from "./alternatives";
import { createMissionEvent, type IngestEventInput } from "./events";
import { analyseDependencyImpact } from "./impact";
import {
  allowsPlanRecompute,
  evaluateApprovalPreservation,
  evaluateMaterialityGate,
  requiresHumanReview,
  requiresParticipantDecision,
} from "./materiality";
import { participantMustDecide } from "./policy";
import { buildWhatChangedItems } from "./presentation";
import {
  appendActivity,
  getActivityLog,
  getLatestPlanVersion,
  getMissionEvents,
  getPendingEvents,
  getPlanVersions,
  getRecoveryState,
  initialiseRecoveryFromPlan,
  nextPlanVersion,
  saveMissionEvent,
  savePlanVersion,
  saveRecoveryState,
} from "./store";
import {
  computeTemporalConstraint,
  isDeadlineImpossible,
  parseDeadlineFromPayload,
} from "./temporal";
import { evaluateReassessmentTrigger } from "./triggers";
import type {
  DependencyState,
  MapAbleMissionEvent,
  MapAbleRecoveryAlternative,
  MapAbleRecoveryState,
  MaterialityGate,
  MissionPlanVersion,
} from "./types";

export type IngestResult = {
  event: MapAbleMissionEvent;
  duplicate: boolean;
  trigger: ReturnType<typeof evaluateReassessmentTrigger>;
  autoReassessed: boolean;
};

export function ingestMissionEvent(input: IngestEventInput): IngestResult {
  if (!adaptiveRecoveryConfig.enabled) throw new Error("ADAPTIVE_RECOVERY_DISABLED");
  if (!agenticNerveCentreConfig.enabled) throw new Error("AGENTIC_NERVE_CENTRE_DISABLED");

  const event = createMissionEvent(input);
  const { duplicate } = saveMissionEvent(event);
  appendActivity(input.missionId, {
    id: randomUUID(), timestamp: event.ingestedAt, kind: "event_ingested",
    summary: `Event ${event.type} ingested from ${event.source}`, eventId: event.eventId,
  });

  const allEvents = getMissionEvents(input.missionId);
  const trigger = evaluateReassessmentTrigger(allEvents);
  let autoReassessed = false;
  if (!duplicate && trigger.shouldReassess && adaptiveRecoveryConfig.mayAutoReassess) {
    reassessMission({ missionId: input.missionId });
    autoReassessed = true;
  } else {
    const state = getRecoveryState(input.missionId);
    if (state) {
      saveRecoveryState({
        ...state, pendingEvents: allEvents,
        trigger: trigger.shouldReassess ? trigger : state.trigger,
        killSwitchActive: adaptiveRecoveryConfig.killSwitchActive,
      });
    }
  }
  return { event, duplicate, trigger, autoReassessed };
}

export function reassessMission(input: {
  missionId: string; actorId?: string; participantId?: string;
}): MapAbleRecoveryState {
  if (!adaptiveRecoveryConfig.enabled) throw new Error("ADAPTIVE_RECOVERY_DISABLED");
  if (adaptiveRecoveryConfig.killSwitchActive) {
    const state = getRecoveryState(input.missionId);
    if (state) {
      appendActivity(input.missionId, {
        id: randomUUID(), timestamp: new Date().toISOString(), kind: "kill_switch_engaged",
        summary: "Auto reassessment blocked by kill switch", eventId: null,
      });
      saveRecoveryState({ ...state, killSwitchActive: true, status: "stable" });
    }
    throw new Error("RECOVERY_KILL_SWITCH_ACTIVE");
  }

  const plan = getMissionPlan(input.missionId);
  if (!plan) throw new Error("MISSION_NOT_FOUND");
  ensureRecoveryInitialised(plan);

  const events = getPendingEvents(input.missionId);
  const trigger = evaluateReassessmentTrigger(events);
  appendActivity(input.missionId, {
    id: randomUUID(), timestamp: new Date().toISOString(), kind: "reassessment_triggered",
    summary: trigger.explanation, eventId: trigger.eventIds[0] ?? null,
  });

  const previousVersion = getLatestPlanVersion(input.missionId);
  const previousStates = new Map<string, DependencyState>(
    (previousVersion?.plan.missionGraph.nodes ?? []).map((n) => [
      n.id,
      n.status === "confirmed" || n.status === "available" ? "healthy"
        : n.status === "missing" ? "missing"
        : n.status === "not_authorised" ? "not_authorised"
        : n.status === "consent_required" ? "consent_required"
        : n.status === "disabled" ? "disabled" : "at_risk",
    ]),
  );

  const impacts = analyseDependencyImpact({ graph: plan.missionGraph, events, previousStates });
  appendActivity(input.missionId, {
    id: randomUUID(), timestamp: new Date().toISOString(), kind: "impact_analysed",
    summary: `${impacts.filter((i) => !i.preserved).length} dependencies affected`, eventId: null,
  });

  const temporalConstraints = plan.missionGraph.nodes
    .filter((n) => events.some((e) => e.affectedNodeIds.includes(n.id)))
    .map((n) => {
      const event = events.find((e) => e.affectedNodeIds.includes(n.id));
      return computeTemporalConstraint({
        nodeId: n.id, label: n.label,
        deadlineIso: event ? parseDeadlineFromPayload(event.payload) : null,
      });
    });

  let workingEvents = [...events];
  if (isDeadlineImpossible(temporalConstraints)) {
    workingEvents = [...workingEvents, createMissionEvent({
      missionId: input.missionId, type: "DEADLINE_APPROACHING", source: "system_derived",
      affectedNodeIds: temporalConstraints.filter((c) => c.status === "impossible").map((c) => c.nodeId),
      payload: { impossible: true },
    })];
  }

  const triggerWithTemporal = evaluateReassessmentTrigger(workingEvents);
  const materialityGate = evaluateMaterialityGate({ trigger: triggerWithTemporal, impacts, events: workingEvents });
  const approvalImpacts = evaluateApprovalPreservation({
    bindings: plan.approvalBindings, events: workingEvents, materialityGate,
  });

  let candidatePlan = plan;
  let candidateVersion: number | null = null;
  if (allowsPlanRecompute(materialityGate)) {
    const newVersion = nextPlanVersion(input.missionId);
    candidatePlan = buildCandidatePlan({ plan, newVersion, changeReason: triggerWithTemporal.explanation, events: workingEvents });
    candidateVersion = newVersion;
    savePlanVersion({
      missionId: input.missionId, planVersion: newVersion, basedOnVersion: plan.planVersion ?? 1,
      changeReason: triggerWithTemporal.explanation, plan: candidatePlan, createdAt: new Date().toISOString(),
    });
  }

  const alternatives = generateRecoveryAlternatives({
    plan: candidatePlan, impacts, materialityGate,
    candidatePlanVersion: candidateVersion ?? (plan.planVersion ?? 1),
  });
  appendActivity(input.missionId, {
    id: randomUUID(), timestamp: new Date().toISOString(), kind: "alternatives_generated",
    summary: `${alternatives.length} recovery options prepared`, eventId: null,
  });

  const whatChanged = buildWhatChangedItems({
    fromVersion: previousVersion?.planVersion ?? 1,
    toVersion: candidateVersion ?? (plan.planVersion ?? 1),
    summaries: impacts.filter((i) => !i.preserved).map((i) => ({
      category: "dependency" as const,
      summary: `${i.label}: ${i.previousState} → ${i.currentState}`,
      detail: i.reason, affectedNodeIds: [i.nodeId],
    })),
  });

  const status = deriveRecoveryStatus(materialityGate, alternatives);
  const state: MapAbleRecoveryState = {
    missionId: input.missionId,
    currentPlanVersion: candidateVersion ?? (plan.planVersion ?? 1),
    activePlanVersion: plan.planVersion ?? 1,
    candidatePlanVersion: candidateVersion,
    status, trigger: triggerWithTemporal, impacts, materialityGate, approvalImpacts, alternatives, whatChanged,
    previousPlanVersions: previousVersion ? [previousVersion.planVersion] : [],
    pendingEvents: [], lastReassessedAt: new Date().toISOString(),
    killSwitchActive: adaptiveRecoveryConfig.killSwitchActive,
  };
  saveRecoveryState(state);
  if (requiresParticipantDecision(materialityGate)) {
    appendActivity(input.missionId, {
      id: randomUUID(), timestamp: new Date().toISOString(), kind: "participant_decision_required",
      summary: "Participant decision required before continuing", eventId: null,
    });
  }
  if (isHumanOperationsConsoleEnabled() && status === "human_review") {
    const participantId = input.participantId ?? input.missionId;
    enqueueHumanOpsReview({
      participantId,
      tenantId: participantId,
      missionId: input.missionId,
      category: impacts.some((i) => i.reason.toLowerCase().includes("safeguard"))
        ? "safeguarding"
        : "general_coordination",
      priority: impacts.some((i) => i.reason.toLowerCase().includes("safeguard"))
        ? "critical"
        : "urgent",
      reasonCodes: [
        `recovery_materiality:${materialityGate}`,
        ...impacts
          .filter((i) => i.currentState === "human_review")
          .map((i) => i.reason),
      ],
      evidenceRefs: impacts.map((i) => `node:${i.nodeId}`),
      requestedBy: input.actorId ?? "recovery_engine",
      source: "recovery_engine",
      sourceReviewItemId: `recovery-${input.missionId}-${state.lastReassessedAt}`,
      participantFacingReason:
        "A change in your mission needs a human reviewer before MapAble continues automated planning.",
    });
  }
  return state;
}

function deriveRecoveryStatus(
  materialityGate: MaterialityGate, alternatives: MapAbleRecoveryAlternative[],
): MapAbleRecoveryState["status"] {
  if (materialityGate === "BLOCKED") return "blocked";
  if (requiresHumanReview(materialityGate)) return "human_review";
  if (materialityGate === "REAPPROVAL_REQUIRED") return "awaiting_reapproval";
  if (participantMustDecide(materialityGate) || alternatives.some((a) => a.requiresParticipantDecision)) {
    return "awaiting_participant";
  }
  if (materialityGate === "NON_MATERIAL") return "stable";
  return "reassessing";
}

function buildCandidatePlan(input: {
  plan: MapAbleMissionPlan; newVersion: number; changeReason: string; events: MapAbleMissionEvent[];
}): MapAbleMissionPlan {
  return {
    ...input.plan,
    planVersion: input.newVersion,
    basedOnVersion: input.plan.planVersion ?? 1,
    changeReason: input.changeReason,
    missionGraph: {
      ...input.plan.missionGraph,
      nodes: input.plan.missionGraph.nodes.map((node) => {
        const failed = input.events.some(
          (e) => e.affectedNodeIds.includes(node.id) &&
            ["TRANSPORT_UNAVAILABLE","WORKER_CANCELLED","ACTION_FAILED"].includes(e.type),
        );
        return failed ? { ...node, status: "unavailable" as const } : node;
      }),
    },
    updatedAt: new Date().toISOString(),
  };
}

function ensureRecoveryInitialised(plan: MapAbleMissionPlan): void {
  if (!getRecoveryState(plan.missionId)) {
    initialiseRecoveryFromPlan({
      ...plan, planVersion: plan.planVersion ?? 1,
      basedOnVersion: plan.basedOnVersion ?? null,
      changeReason: plan.changeReason ?? "Initial plan",
    });
  }
}

export function selectRecoveryAlternative(input: {
  missionId: string; alternativeId: string; actorId: string; participantId: string; consentScopes?: string[];
}): {
  state: MapAbleRecoveryState;
  selectedAlternative: MapAbleRecoveryAlternative;
  candidatePlan: MapAbleMissionPlan;
  kernelProposalIds: string[];
} {
  if (!adaptiveRecoveryConfig.enabled) throw new Error("ADAPTIVE_RECOVERY_DISABLED");
  const state = getRecoveryState(input.missionId);
  if (!state) throw new Error("RECOVERY_STATE_NOT_FOUND");
  const alternative = state.alternatives.find((a) => a.alternativeId === input.alternativeId);
  if (!alternative) throw new Error("ALTERNATIVE_NOT_FOUND");
  const candidateVersion = getLatestPlanVersion(input.missionId);
  if (!candidateVersion) throw new Error("CANDIDATE_PLAN_NOT_FOUND");

  let candidatePlan = candidateVersion.plan;
  if (alternative.label.toLowerCase().includes("own transport")) {
    candidatePlan = {
      ...candidatePlan,
      missionGraph: {
        ...candidatePlan.missionGraph,
        nodes: candidatePlan.missionGraph.nodes.map((n) =>
          n.id === "node-transport"
            ? { ...n, status: "confirmed" as const, details: "Participant confirmed own transport" }
            : n,
        ),
      },
    };
  }

  const kernelProposalIds: string[] = [];
  if (isActionKernelOperational() && alternative.actionProposalIds.length > 0) {
    for (const proposalId of alternative.actionProposalIds) {
      const missionProposal = candidatePlan.actionProposals.find((p) => p.id === proposalId);
      if (!missionProposal) continue;
      try {
        const kernelProposal = prepareKernelProposalFromMission({
          missionProposal, missionId: input.missionId, traceId: candidatePlan.traceId,
          participantId: input.participantId, actorId: input.actorId,
          consentScopes: input.consentScopes ?? [],
        });
        if (kernelProposal) {
          kernelProposalIds.push(kernelProposal.proposalId);
          appendActivity(input.missionId, {
            id: randomUUID(), timestamp: new Date().toISOString(), kind: "kernel_proposal_prepared",
            summary: `Action Kernel proposal prepared: ${kernelProposal.actionKey} (not executed)`, eventId: null,
          });
        }
      } catch { /* kernel may reject if per-action flags off */ }
    }
  }

  const selectedAlternative = { ...alternative, kernelProposalIds };
  saveMissionPlan(candidatePlan);
  appendActivity(input.missionId, {
    id: randomUUID(), timestamp: new Date().toISOString(), kind: "alternative_selected",
    summary: `Participant selected: ${alternative.label}`, eventId: null,
  });

  const updatedState: MapAbleRecoveryState = {
    ...state,
    activePlanVersion: candidatePlan.planVersion ?? state.activePlanVersion,
    candidatePlanVersion: null,
    status: alternative.requiresHumanReview ? "human_review"
      : alternative.requiresReapproval ? "awaiting_reapproval" : "stable",
    alternatives: [],
  };
  saveRecoveryState(updatedState);
  return { state: updatedState, selectedAlternative, candidatePlan, kernelProposalIds };
}

export function getRecoverySnapshot(missionId: string): {
  state: MapAbleRecoveryState | null;
  activity: ReturnType<typeof getActivityLog>;
  planVersions: MissionPlanVersion[];
} {
  return { state: getRecoveryState(missionId), activity: getActivityLog(missionId), planVersions: getPlanVersions(missionId) };
}

export function ensureMissionRecoveryTracking(plan: MapAbleMissionPlan): void {
  if (!adaptiveRecoveryConfig.enabled) return;
  initialiseRecoveryFromPlan({
    ...plan, planVersion: plan.planVersion ?? 1,
    basedOnVersion: plan.basedOnVersion ?? null,
    changeReason: plan.changeReason ?? "Initial plan",
  });
}
