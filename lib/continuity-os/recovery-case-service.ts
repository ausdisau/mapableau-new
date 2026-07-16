import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auditContinuityEvent } from "@/lib/continuity-os/audit";
import {
  canExecuteRecoveryActions,
  isFailureDetectionEnabled,
  isHandoffsEnabled,
  isRecoveryOptionsEnabled,
  isShadowMode,
} from "@/lib/continuity-os/config";
import { classifyFailureSignal, type FailureSignalInput } from "@/lib/continuity-os/failure";
import { calculateFailureImpact } from "@/lib/continuity-os/impact";
import { projectLifeEventDependencies } from "@/lib/continuity-os/dependency-projection";
import {
  compareRecoveryOptions,
  generateRecoveryOptions,
} from "@/lib/continuity-os/recovery-options";
import { getPlaybook, isSpecialistHighRiskPlaybook } from "@/lib/continuity-os/playbooks";
import {
  assertHandoffTransition,
  handoffCompletionClaim,
} from "@/lib/continuity-os/handoff";
import {
  buildRecoveryReceipt,
  detectFalseRecovery,
} from "@/lib/continuity-os/receipts";
import { assertMissionNotStopped } from "@/lib/continuity-os/stop";
import type {
  ContinuityPreferenceSet,
  HandoffState,
  RecoveryOutcomeState,
} from "@/lib/continuity-os/types";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function reportServiceFailure(params: {
  participantId: string;
  actorUserId: string;
  signal: FailureSignalInput;
  missionId: string;
  forged?: boolean;
  stale?: boolean;
  essentialService?: boolean;
  hardRequirements?: string[];
  claimedReplacementFeatures?: string[];
  partnerConfirmedAvailable?: boolean;
  knownAdditionalCost?: string;
}) {
  if (!isFailureDetectionEnabled()) {
    throw new ContinuityFeatureDisabledError(
      "Service failure detection is disabled"
    );
  }

  await assertMissionNotStopped(params.missionId);

  const mission = await prisma.careOSMission.findFirst({
    where: {
      id: params.missionId,
      participantId: params.participantId,
    },
    include: { lifeEventExtension: true },
  });
  if (!mission?.lifeEventExtension) {
    throw new Error("Life event mission not found");
  }

  const classified = classifyFailureSignal(params.signal, {
    forged: params.forged,
    stale: params.stale,
    essentialService: params.essentialService,
  });

  const failure = await prisma.serviceFailure.create({
    data: {
      missionId: params.missionId,
      participantId: params.participantId,
      source: params.signal.source,
      sourceType: params.signal.sourceType,
      service: params.signal.service,
      observedAt: new Date(params.signal.observedAt),
      receivedAt: new Date(params.signal.receivedAt),
      evidence: params.signal.evidence ?? null,
      confidence: params.signal.confidence,
      urgency: params.signal.urgency,
      visibility: params.signal.publicOrPrivate,
      affectedDependencyId: params.signal.affectedDependencyId ?? null,
      verificationRequirement: params.signal.verificationRequirement,
      rawSummary: params.signal.rawSummary,
      failureClass: classified.failureClass,
      severity: classified.severity,
      verificationStatus: classified.verificationStatus,
      playbookKeysJson: asJson(classified.playbookKeys),
      signalsJson: asJson(params.signal),
    },
  });

  await auditContinuityEvent({
    action: "continuity.failure.signal_received",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "ServiceFailure",
    entityId: failure.id,
    metadata: {
      failureClass: classified.failureClass,
      severity: classified.severity,
      verificationStatus: classified.verificationStatus,
    },
  });

  if (
    classified.verificationStatus === "rejected_forged" ||
    classified.verificationStatus === "rejected_stale"
  ) {
    return { failure, classified, recoveryCase: null, options: [], shadow: isShadowMode() };
  }

  const ext = mission.lifeEventExtension;
  const prior = projectLifeEventDependencies({
    typeKey: ext.typeKey,
    typeVersion: ext.typeVersion,
    preservedUnknowns: (ext.unknownsJson as string[]) ?? [],
    hardRequirementKeys: (ext.nonNegotiableRequirementsJson as string[]) ?? [],
  });

  const failedDependencyId =
    params.signal.affectedDependencyId ??
    (classified.playbookKeys.includes("accessible_transport_cancellation")
      ? "accessible_transport"
      : classified.playbookKeys.includes("support_worker_cancellation")
        ? "morning_support_worker"
        : prior.nodes[0]?.id ?? "unknown");

  const impact = calculateFailureImpact({
    typeKey: ext.typeKey,
    typeVersion: ext.typeVersion,
    failedDependencyId,
    priorProjection: prior,
    preservedUnknowns: (ext.unknownsJson as string[]) ?? [],
    hardRequirementKeys: (ext.nonNegotiableRequirementsJson as string[]) ?? [],
  });

  await prisma.serviceFailureImpact.create({
    data: {
      failureId: failure.id,
      version: impact.version,
      impactJson: asJson(impact),
      priorPlanJson: asJson(impact.priorProjectionSnapshot),
    },
  });

  await prisma.careOSMission.update({
    where: { id: mission.id },
    data: {
      status: "recovery_required",
      stateVersion: { increment: 1 },
      lifeEventExtension: {
        update: { continuityStatus: "recovery_required" },
      },
    },
  });

  const playbookKey = classified.playbookKeys[0] ?? "accessible_transport_cancellation";
  const prefs = (ext.preferencesJson ?? {}) as ContinuityPreferenceSet;

  let options: ReturnType<typeof generateRecoveryOptions> = [];
  if (isRecoveryOptionsEnabled()) {
    options = generateRecoveryOptions({
      failureDependencyId: failedDependencyId,
      playbookKey,
      impact,
      preferences: prefs,
      hardRequirements: params.hardRequirements ?? ["ramp"],
      claimedReplacementFeatures: params.claimedReplacementFeatures,
      partnerConfirmedAvailable: params.partnerConfirmedAvailable,
      knownAdditionalCost: params.knownAdditionalCost,
    });
  }

  const recoveryCase = await prisma.recoveryCase.create({
    data: {
      missionId: params.missionId,
      participantId: params.participantId,
      failureId: failure.id,
      status: "open",
      playbookKey,
      shadowOnly: isShadowMode(),
      impactVersion: impact.version,
      optionsJson: asJson(options),
      selectedOptionId: null,
      ownerRole: getPlaybook(playbookKey)?.requiredHumanRoles[0] ?? "navigator",
    },
  });

  await auditContinuityEvent({
    action: "continuity.recovery.case_created",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "RecoveryCase",
    entityId: recoveryCase.id,
    metadata: {
      shadowOnly: recoveryCase.shadowOnly,
      playbookKey,
      specialistHighRisk: isSpecialistHighRiskPlaybook(playbookKey),
    },
  });

  return {
    failure,
    classified,
    impact,
    recoveryCase,
    options,
    comparison: compareRecoveryOptions(options),
    shadow: isShadowMode(),
    executionAllowed: canExecuteRecoveryActions(),
  };
}

export async function getRecoveryCaseForParticipant(params: {
  recoveryId: string;
  participantId: string;
}) {
  if (!isRecoveryOptionsEnabled() && !isFailureDetectionEnabled()) {
    throw new ContinuityFeatureDisabledError("Recovery is disabled");
  }

  return prisma.recoveryCase.findFirst({
    where: { id: params.recoveryId, participantId: params.participantId },
    include: {
      failure: true,
      receipts: true,
      handoffs: true,
      mission: { include: { lifeEventExtension: true } },
    },
  });
}

export async function selectRecoveryOption(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
  optionId: string;
}) {
  if (!isRecoveryOptionsEnabled()) {
    throw new ContinuityFeatureDisabledError("Recovery options disabled");
  }

  const recovery = await getRecoveryCaseForParticipant(params);
  if (!recovery) throw new Error("Recovery case not found");
  await assertMissionNotStopped(recovery.missionId);

  const options =
    (recovery.optionsJson as unknown as Array<{
      id: string;
      availability: string;
      hardRequirementsMet: boolean;
    }>) ?? [];
  const selected = options.find((o) => o.id === params.optionId);
  if (!selected) throw new Error("Option not found");
  if (!selected.hardRequirementsMet || selected.availability === "blocked") {
    throw new Error("Cannot select a blocked or ineligible option");
  }

  const updated = await prisma.recoveryCase.update({
    where: { id: recovery.id },
    data: {
      selectedOptionId: params.optionId,
      status: "option_selected",
    },
  });

  await auditContinuityEvent({
    action: "continuity.recovery.option_selected",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "RecoveryCase",
    entityId: recovery.id,
    metadata: { optionId: params.optionId, shadowOnly: recovery.shadowOnly },
  });

  return updated;
}

/**
 * Prepare an AURA-compatible proposal payload.
 * Does not execute. In shadow mode, never contacts services.
 */
export async function prepareRecoveryProposal(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
}) {
  const recovery = await getRecoveryCaseForParticipant(params);
  if (!recovery?.selectedOptionId) {
    throw new Error("Select a recovery option first");
  }
  await assertMissionNotStopped(recovery.missionId);

  if (isSpecialistHighRiskPlaybook(recovery.playbookKey)) {
    throw new Error(
      "Specialist high-risk playbook — AURA cannot prepare investigative proposals; escalate to human pathway"
    );
  }

  const options =
    (recovery.optionsJson as unknown as Array<{
      id: string;
      title: string;
      requiredDisclosure: string[];
    }>) ?? [];
  const selected = options.find((o) => o.id === recovery.selectedOptionId);
  if (!selected) throw new Error("Selected option missing");

  const proposal = {
    actionType: "recovery_service_request",
    applicationService: "mapable-continuity-bridge",
    purpose: "participant_approved_recovery",
    risk: "communication",
    payload: {
      recoveryCaseId: recovery.id,
      optionId: selected.id,
      optionTitle: selected.title,
      missionId: recovery.missionId,
      shadowOnly: recovery.shadowOnly || isShadowMode(),
      executionAllowed: canExecuteRecoveryActions(),
    },
    fieldsShared: selected.requiredDisclosure,
    fieldsOmitted: ["full_access_passport", "medical_history", "unrelated_missions"],
    futureParticipantApprovalRequired: true,
    humanReviewRequired: true,
    note: "Proposal prepared only — model cannot execute. Deterministic MapAble services execute after fresh approval.",
  };

  await prisma.recoveryCase.update({
    where: { id: recovery.id },
    data: {
      status: "proposal_prepared",
      proposalJson: asJson(proposal),
    },
  });

  await auditContinuityEvent({
    action: "continuity.recovery.proposal_prepared",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "RecoveryCase",
    entityId: recovery.id,
    metadata: {
      optionId: selected.id,
      executionAllowed: canExecuteRecoveryActions(),
    },
  });

  return proposal;
}

export async function escalateRecoveryCase(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
  destinationRole: string;
  reason: string;
}) {
  const recovery = await getRecoveryCaseForParticipant(params);
  if (!recovery) throw new Error("Recovery case not found");

  const escalation = await prisma.recoveryEscalation.create({
    data: {
      recoveryCaseId: recovery.id,
      destinationRole: params.destinationRole,
      reason: params.reason,
      status: "queued",
      fieldMinimisationJson: asJson({
        shared: ["mission_goal", "failed_dependency", "selected_option"],
        omitted: ["full_account", "unrelated_missions"],
      }),
    },
  });

  await prisma.recoveryCase.update({
    where: { id: recovery.id },
    data: { status: "escalated", ownerRole: params.destinationRole },
  });

  await auditContinuityEvent({
    action: "continuity.recovery.escalated",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "RecoveryEscalation",
    entityId: escalation.id,
    metadata: { destinationRole: params.destinationRole },
  });

  return escalation;
}

export async function createRecoveryHandoff(params: {
  participantId: string;
  actorUserId: string;
  missionId: string;
  recoveryCaseId?: string;
  sendingOrganisation: string;
  receivingOrganisation: string;
  purpose: string;
  tasks: string[];
  participantApprovedFields: string[];
  informationOmitted: string[];
}) {
  if (!isHandoffsEnabled()) {
    throw new ContinuityFeatureDisabledError("Handoffs disabled");
  }
  await assertMissionNotStopped(params.missionId);

  const handoff = await prisma.recoveryHandoff.create({
    data: {
      missionId: params.missionId,
      recoveryCaseId: params.recoveryCaseId ?? null,
      participantId: params.participantId,
      sendingOrganisation: params.sendingOrganisation,
      receivingOrganisation: params.receivingOrganisation,
      purpose: params.purpose,
      tasksJson: asJson(params.tasks),
      participantApprovedFieldsJson: asJson(params.participantApprovedFields),
      informationOmittedJson: asJson(params.informationOmitted),
      state: "draft",
      unresolvedItemsJson: asJson(params.tasks),
    },
  });

  return handoff;
}

export async function transitionRecoveryHandoff(params: {
  handoffId: string;
  participantId: string;
  actorUserId: string;
  toState: HandoffState;
}) {
  if (!isHandoffsEnabled()) {
    throw new ContinuityFeatureDisabledError("Handoffs disabled");
  }

  const handoff = await prisma.recoveryHandoff.findFirst({
    where: { id: params.handoffId, participantId: params.participantId },
  });
  if (!handoff) throw new Error("Handoff not found");

  assertHandoffTransition(handoff.state as HandoffState, params.toState);

  const updated = await prisma.recoveryHandoff.update({
    where: { id: handoff.id },
    data: { state: params.toState },
  });

  const claim = handoffCompletionClaim(params.toState);
  await auditContinuityEvent({
    action:
      params.toState === "accepted"
        ? "continuity.handoff.accepted"
        : params.toState === "rejected"
          ? "continuity.handoff.rejected"
          : "continuity.handoff.sent",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "RecoveryHandoff",
    entityId: handoff.id,
    metadata: { toState: params.toState, claim },
  });

  return { handoff: updated, claim };
}

export async function recordRecoveryOutcome(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
  outcome: RecoveryOutcomeState;
  postconditions: Array<{ key: string; passed: boolean; evidence?: string }>;
  operatorAcknowledged?: boolean;
  hardRequirementsMet?: boolean;
}) {
  const recovery = await getRecoveryCaseForParticipant(params);
  if (!recovery) throw new Error("Recovery case not found");

  const falseRecovery = detectFalseRecovery({
    operatorAcknowledged: params.operatorAcknowledged ?? false,
    hardRequirementsMet: params.hardRequirementsMet ?? true,
  });

  let outcome = params.outcome;
  if (falseRecovery.isFalseRecovery) {
    outcome = "partially_restored";
  }

  const receipt = buildRecoveryReceipt({
    originalGoal:
      recovery.mission.lifeEventExtension?.participantGoal ??
      recovery.mission.desiredOutcome,
    failure: recovery.failure.rawSummary,
    affectedServices: [recovery.failure.service],
    optionSelected: recovery.selectedOptionId ?? "none",
    participantApprovalId: `participant:${params.participantId}`,
    actionsTaken: recovery.proposalJson
      ? ["proposal_prepared"]
      : [],
    recordsCreated: [`recovery_case:${recovery.id}`],
    communicationsDelivered: [],
    handoffsAccepted: recovery.handoffs
      .filter((h) => h.state === "accepted" || h.state === "completed")
      .map((h) => h.id),
    postconditions: params.postconditions,
    remainingUnknowns: falseRecovery.isFalseRecovery
      ? [falseRecovery.reason]
      : [],
    financialEffects: [],
    complaintOrReviewOptions: [
      "Provider complaints",
      "Rights Navigator",
      ...(falseRecovery.isFalseRecovery
        ? ["AccessibilityOps false-recovery review"]
        : []),
    ],
    outcome,
    evidence: params.postconditions
      .map((p) => p.evidence)
      .filter((e): e is string => Boolean(e)),
    timestamp: new Date().toISOString(),
  });

  const saved = await prisma.recoveryReceipt.create({
    data: {
      recoveryCaseId: recovery.id,
      participantId: params.participantId,
      receiptJson: asJson(receipt),
      outcome,
      falseRecovery: falseRecovery.isFalseRecovery,
    },
  });

  await prisma.recoveryCase.update({
    where: { id: recovery.id },
    data: {
      status: falseRecovery.isFalseRecovery ? "open" : "outcome_recorded",
      outcome,
    },
  });

  await auditContinuityEvent({
    action: "continuity.outcome.recorded",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "RecoveryReceipt",
    entityId: saved.id,
    metadata: {
      outcome,
      falseRecovery: falseRecovery.isFalseRecovery,
      serviceActionCompleted: receipt.serviceActionCompleted,
      realWorldOutcomeConfirmed: receipt.realWorldOutcomeConfirmed,
      participantGoalAchieved: receipt.participantGoalAchieved,
    },
  });

  return { receipt, falseRecovery };
}
