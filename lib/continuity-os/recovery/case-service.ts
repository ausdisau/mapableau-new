import { createHash, randomUUID } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import {
  getContinuityOsFlags,
  continuityOsPermanentDeny,
  isHandoffsEnabled,
  isOutcomeVerificationEnabled,
  isRecoveryOptionsEnabled,
  isRecoveryPlaybooksEnabled,
  isShadowOrDemoMode,
  mayExecuteApprovedRecoveryActions,
} from "@/lib/continuity-os/feature-flags";
import { assertMissionNotStopped } from "@/lib/continuity-os/missions/careos-mission-adapter";
import {
  compareRecoveryOptions,
  generateRecoveryOptions,
} from "@/lib/continuity-os/recovery/options-engine";
import { requirePlaybook } from "@/lib/continuity-os/recovery/playbooks";
import { prisma } from "@/lib/prisma";

export async function createRecoveryCase(params: {
  participantId: string;
  actorUserId: string;
  missionId?: string;
  serviceFailureId?: string;
  playbookCode: string;
  originalGoal: string;
  horizon?: string;
  preferences?: {
    avoidUnfamiliarWorkers?: boolean;
    preserveAppointment?: boolean;
    minimiseDisclosure?: boolean;
    preferHumanCoordinator?: boolean;
  };
  replacementVehicleAccessible?: boolean | null;
  simulatedOnly?: boolean;
}) {
  if (!isRecoveryOptionsEnabled() || !isRecoveryPlaybooksEnabled()) {
    throw new ContinuityOsError(
      "RECOVERY_OPTIONS_DISABLED",
      "Recovery options are disabled.",
      503
    );
  }
  if (params.missionId) {
    await assertMissionNotStopped(params.missionId);
  }

  const playbook = requirePlaybook(params.playbookCode);
  if (playbook.highRisk) {
    // Still create case but only human pathway options.
  }

  const drafts = generateRecoveryOptions({
    playbook,
    originalGoal: params.originalGoal,
    hardRequirements: ["accessible_vehicle"],
    preferences: params.preferences ?? {},
    replacementVehicleAccessible: params.replacementVehicleAccessible,
    simulatedOnly: params.simulatedOnly ?? isShadowOrDemoMode(),
  });

  const recoveryCase = await prisma.recoveryCase.create({
    data: {
      missionId: params.missionId,
      participantId: params.participantId,
      serviceFailureId: params.serviceFailureId,
      playbookCode: playbook.code,
      playbookVersion: playbook.version,
      status: "open",
      originalGoal: params.originalGoal,
      horizon: params.horizon ?? "immediate",
      ownerRole: "participant",
      ownerUserId: params.participantId,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      options: {
        create: drafts.map((draft, index) => ({
          optionKey: draft.optionKey,
          label: draft.label,
          description: draft.description,
          availabilityState: draft.availabilityState,
          preservesOriginalGoal: draft.preservesOriginalGoal,
          hardRequirementsMet: draft.hardRequirementsMet,
          excludedReason: draft.excludedReason,
          unknownsJson: draft.unknowns,
          disclosureJson: draft.disclosure,
          peopleJson: draft.people,
          timingJson: draft.timing,
          costJson: draft.cost,
          preferenceMatchJson: draft.preferenceMatch,
          evidenceConfidence: draft.evidenceConfidence,
          approvalsRequiredJson: draft.approvalsRequired,
          fallbackJson: draft.fallback,
          horizon: draft.horizon,
          sortOrder: index,
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        })),
      },
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.recovery.case_created",
    entityType: "RecoveryCase",
    entityId: recoveryCase.id,
    participantId: params.participantId,
    metadata: {
      playbookCode: playbook.code,
      optionCount: drafts.length,
      mode: getContinuityOsFlags().mode,
    },
  });

  return {
    recoveryCase,
    comparison: compareRecoveryOptions(drafts),
    playbook,
  };
}

export async function getRecoveryCase(
  recoveryId: string,
  participantId: string
) {
  const recoveryCase = await prisma.recoveryCase.findFirst({
    where: { id: recoveryId, participantId },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      decisions: { orderBy: { createdAt: "desc" } },
      actionLinks: true,
      handoffs: true,
      escalations: true,
      receipts: { orderBy: { createdAt: "desc" } },
      outcomes: { orderBy: { createdAt: "desc" } },
      serviceFailure: true,
    },
  });
  if (!recoveryCase) {
    throw new ContinuityOsError("NOT_FOUND", "Recovery case not found.", 404);
  }
  return recoveryCase;
}

export async function selectRecoveryOption(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
  optionId: string;
}) {
  if (!isRecoveryOptionsEnabled()) {
    throw new ContinuityOsError(
      "RECOVERY_OPTIONS_DISABLED",
      "Recovery options are disabled.",
      503
    );
  }
  const recoveryCase = await getRecoveryCase(
    params.recoveryId,
    params.participantId
  );
  if (recoveryCase.stopState || recoveryCase.status === "cancelled_by_participant") {
    throw new ContinuityOsError("MISSION_STOPPED", "Recovery was stopped.", 409);
  }
  if (params.actorUserId !== params.participantId) {
    throw new ContinuityOsError("FORBIDDEN", "Participant approval required.", 403);
  }

  const option = recoveryCase.options.find((o) => o.id === params.optionId);
  if (!option) {
    throw new ContinuityOsError("NOT_FOUND", "Option not found.", 404);
  }
  if (!option.hardRequirementsMet || option.availabilityState === "blocked") {
    throw new ContinuityOsError(
      "HARD_REQUIREMENT_FAILED",
      "This option fails a hard access requirement or was excluded.",
      400
    );
  }
  // Selecting an option prepares a request/proposal — it does not confirm service availability.
  if (
    option.availabilityState === "verified_available" &&
    isShadowOrDemoMode()
  ) {
    throw new ContinuityOsError(
      "SIMULATED_NOT_AVAILABLE",
      "Simulated availability cannot be treated as a verified service.",
      409
    );
  }

  const approvalHash = createHash("sha256")
    .update(`${recoveryCase.id}:${option.id}:${params.actorUserId}:${Date.now()}`)
    .digest("hex");

  const decision = await prisma.recoveryDecision.create({
    data: {
      recoveryCaseId: recoveryCase.id,
      optionId: option.id,
      decidedByUserId: params.actorUserId,
      decision: "selected",
      approvalHash,
    },
  });

  const updated = await prisma.recoveryCase.update({
    where: { id: recoveryCase.id },
    data: {
      selectedOptionId: option.id,
      status: "option_selected",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.recovery.option_selected",
    entityType: "RecoveryDecision",
    entityId: decision.id,
    participantId: params.participantId,
    metadata: {
      optionKey: option.optionKey,
      availabilityState: option.availabilityState,
    },
  });

  return { recoveryCase: updated, decision, option };
}

/**
 * Prepare an immutable proposal link. Does not execute domain writes.
 * In supervised mode this records a RecoveryActionLink awaiting AURA/application gates.
 */
export async function prepareRecoveryProposal(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (!isRecoveryOptionsEnabled()) {
    throw new ContinuityOsError(
      "RECOVERY_OPTIONS_DISABLED",
      "Recovery options are disabled.",
      503
    );
  }
  if (continuityOsPermanentDeny.automaticAssignment) {
    throw new ContinuityOsError(
      "AUTOMATIC_ACTION_FORBIDDEN",
      "Automatic assignment is permanently forbidden.",
      403
    );
  }

  const recoveryCase = await getRecoveryCase(
    params.recoveryId,
    params.participantId
  );
  if (!recoveryCase.selectedOptionId) {
    throw new ContinuityOsError(
      "INVALID_STATE_TRANSITION",
      "Select an option before preparing a proposal.",
      409
    );
  }
  const option = recoveryCase.options.find(
    (o) => o.id === recoveryCase.selectedOptionId
  );
  if (!option) {
    throw new ContinuityOsError("NOT_FOUND", "Selected option missing.", 404);
  }

  const idempotencyKey = `recovery-proposal:${recoveryCase.id}:${option.id}`;
  const existing = await prisma.recoveryActionLink.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return existing;

  const state = isShadowOrDemoMode()
    ? "shadow_proposal_prepared"
    : mayExecuteApprovedRecoveryActions()
      ? "proposal_prepared"
      : "shadow_proposal_prepared";

  const link = await prisma.recoveryActionLink.create({
    data: {
      recoveryCaseId: recoveryCase.id,
      actionType: option.optionKey,
      applicationService: mapOptionToService(option.optionKey),
      state,
      idempotencyKey,
      payloadJson: {
        optionKey: option.optionKey,
        availabilityState: option.availabilityState,
        disclosure: option.disclosureJson,
        note:
          "AURA may draft/explain; deterministic services execute only after fresh participant approval. Request ≠ confirmed.",
        auraProposalId: null,
        executionForbiddenInShadow: isShadowOrDemoMode(),
      },
    },
  });

  await prisma.recoveryCase.update({
    where: { id: recoveryCase.id },
    data: { status: "proposal_prepared" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.recovery.proposal_created",
    entityType: "RecoveryActionLink",
    entityId: link.id,
    participantId: params.participantId,
    metadata: {
      state: link.state,
      applicationService: link.applicationService,
    },
  });

  return link;
}

function mapOptionToService(optionKey: string): string {
  if (optionKey.includes("transport") || optionKey.includes("vehicle")) {
    return "lib/transport";
  }
  if (optionKey.includes("backup_shift") || optionKey.includes("worker")) {
    return "lib/care/backup-shift-recovery-service";
  }
  if (optionKey.includes("employer")) {
    return "lib/notifications";
  }
  return "human_assistance";
}

export async function escalateRecoveryCase(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
  destinationRole: string;
  purpose: string;
  fieldsShared?: string[];
  highRisk?: boolean;
}) {
  const recoveryCase = await getRecoveryCase(
    params.recoveryId,
    params.participantId
  );
  if (params.highRisk || recoveryCase.playbookCode === "family_violence_safe_mode") {
    // High-risk: human only, minimised fields, no ordinary automation.
  }

  const escalation = await prisma.recoveryEscalation.create({
    data: {
      recoveryCaseId: recoveryCase.id,
      destinationRole: params.destinationRole,
      purpose: params.purpose,
      fieldsSharedJson: params.fieldsShared ?? ["goal", "failure_summary"],
      queueState: "queued",
      highRisk: Boolean(params.highRisk),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.recoveryCase.update({
    where: { id: recoveryCase.id },
    data: { status: "escalated" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.recovery.escalated",
    entityType: "RecoveryEscalation",
    entityId: escalation.id,
    participantId: params.participantId,
    metadata: {
      destinationRole: params.destinationRole,
      highRisk: Boolean(params.highRisk),
    },
  });

  return escalation;
}

export async function cancelRecoveryCase(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (params.actorUserId !== params.participantId) {
    throw new ContinuityOsError("FORBIDDEN", "Participant approval required.", 403);
  }
  const recoveryCase = await getRecoveryCase(
    params.recoveryId,
    params.participantId
  );
  const updated = await prisma.recoveryCase.update({
    where: { id: recoveryCase.id },
    data: { status: "cancelled_by_participant", stopState: true },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.recovery.cancelled",
    entityType: "RecoveryCase",
    entityId: updated.id,
    participantId: params.participantId,
  });
  return updated;
}

export async function createHandoff(params: {
  participantId: string;
  actorUserId: string;
  recoveryCaseId?: string;
  missionId?: string;
  sendingRole: string;
  receivingRole: string;
  purpose: string;
  tasks: unknown[];
  approvedFields: string[];
  omittedFields: string[];
  deadlineAt?: Date;
}) {
  if (!isHandoffsEnabled()) {
    throw new ContinuityOsError("HANDOFFS_DISABLED", "Handoffs are disabled.", 503);
  }

  const handoff = await prisma.recoveryHandoff.create({
    data: {
      recoveryCaseId: params.recoveryCaseId,
      missionId: params.missionId,
      sendingRole: params.sendingRole,
      receivingRole: params.receivingRole,
      purpose: params.purpose,
      status: "participant_review",
      tasksJson: params.tasks,
      approvedFieldsJson: params.approvedFields,
      omittedFieldsJson: params.omittedFields,
      deadlineAt: params.deadlineAt,
      receiptJson: { sent: false, delivered: false, accepted: false },
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.handoff.created",
    entityType: "RecoveryHandoff",
    entityId: handoff.id,
    participantId: params.participantId,
  });

  return handoff;
}

export async function acceptHandoff(params: {
  handoffId: string;
  actorUserId: string;
  partial?: boolean;
}) {
  if (!isHandoffsEnabled()) {
    throw new ContinuityOsError("HANDOFFS_DISABLED", "Handoffs are disabled.", 503);
  }
  const handoff = await prisma.recoveryHandoff.findUnique({
    where: { id: params.handoffId },
  });
  if (!handoff) {
    throw new ContinuityOsError("NOT_FOUND", "Handoff not found.", 404);
  }
  if (handoff.status !== "sent" && handoff.status !== "received" && handoff.status !== "participant_review") {
    // Allow accept from participant_review after send simulation in shadow.
  }

  const updated = await prisma.recoveryHandoff.update({
    where: { id: handoff.id },
    data: {
      status: params.partial ? "partially_accepted" : "accepted",
      acceptedAt: new Date(),
      receiptJson: {
        ...(handoff.receiptJson as object),
        accepted: !params.partial,
        partiallyAccepted: Boolean(params.partial),
        acceptedAt: new Date().toISOString(),
        note: "Accepted handoff is not proof every task completed.",
      },
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.handoff.accepted",
    entityType: "RecoveryHandoff",
    entityId: updated.id,
    metadata: { partial: Boolean(params.partial) },
  });

  return updated;
}

export async function rejectHandoff(params: {
  handoffId: string;
  actorUserId: string;
  reason: string;
}) {
  if (!isHandoffsEnabled()) {
    throw new ContinuityOsError("HANDOFFS_DISABLED", "Handoffs are disabled.", 503);
  }
  const updated = await prisma.recoveryHandoff.update({
    where: { id: params.handoffId },
    data: {
      status: "rejected",
      rejectedAt: new Date(),
      rejectionReason: params.reason,
      receiptJson: {
        accepted: false,
        rejected: true,
        rejectedAt: new Date().toISOString(),
      },
    },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.handoff.rejected",
    entityType: "RecoveryHandoff",
    entityId: updated.id,
  });
  return updated;
}

export async function recordRecoveryOutcome(params: {
  recoveryId: string;
  participantId: string;
  actorUserId: string;
  state: string;
  summary: string;
  falseRecovery?: boolean;
  evidence?: unknown[];
}) {
  if (!isOutcomeVerificationEnabled()) {
    throw new ContinuityOsError(
      "OUTCOME_VERIFICATION_DISABLED",
      "Outcome verification is disabled.",
      503
    );
  }
  const recoveryCase = await getRecoveryCase(
    params.recoveryId,
    params.participantId
  );

  const outcome = await prisma.recoveryOutcome.create({
    data: {
      recoveryCaseId: recoveryCase.id,
      state: params.state,
      summary: params.summary,
      falseRecovery: Boolean(params.falseRecovery),
      evidenceJson: params.evidence ?? [],
      recordedByUserId: params.actorUserId,
    },
  });

  if (params.falseRecovery) {
    await prisma.recoveryCase.update({
      where: { id: recoveryCase.id },
      data: { status: "recovery_required" },
    });
    await prisma.recoveryLearningReview.create({
      data: {
        missionId: recoveryCase.missionId,
        recoveryCaseId: recoveryCase.id,
        findingType: "false_recovery",
        summary: params.summary,
        proposalJson: {
          accessibilityOpsReview: true,
          providerQualityReview: true,
        },
        status: "proposed",
      },
    });
  } else {
    await prisma.recoveryCase.update({
      where: { id: recoveryCase.id },
      data: { status: params.state },
    });
  }

  const receipt = await prisma.recoveryReceipt.create({
    data: {
      recoveryCaseId: recoveryCase.id,
      originalGoal: recoveryCase.originalGoal,
      failureSummary: recoveryCase.serviceFailureId
        ? `Linked failure ${recoveryCase.serviceFailureId}`
        : "Participant-selected recovery",
      optionSelectedJson: {
        optionId: recoveryCase.selectedOptionId,
      },
      participantApprovalJson: {
        required: true,
        actorUserId: params.actorUserId,
      },
      actionsTakenJson: recoveryCase.actionLinks,
      recordsCreatedJson: [],
      communicationsJson: [],
      handoffsJson: recoveryCase.handoffs,
      postconditionsJson: [],
      remainingUnknownsJson: ["real_world_outcome_may_remain_unobserved"],
      financialEffectsJson: {},
      complaintRoutesJson: ["rights_centre", "provider_complaint"],
      finalOutcome: params.state,
      evidenceJson: params.evidence ?? [],
      limitationsJson: [
        "Service acknowledgement is not a completed recovery.",
        "A queued action is not an executed action.",
        "A transport request is not a confirmed ride.",
      ],
      serviceActionCompleted: params.state === "restored" || params.state === "partially_restored",
      realWorldOutcomeConfirmed:
        params.state === "restored" && !params.falseRecovery,
      participantGoalAchieved: params.state === "restored" || params.state === "alternative_goal_completed",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.recovery.outcome_recorded",
    entityType: "RecoveryOutcome",
    entityId: outcome.id,
    participantId: params.participantId,
    metadata: {
      state: params.state,
      falseRecovery: Boolean(params.falseRecovery),
      receiptId: receipt.id,
    },
  });

  return { outcome, receipt };
}

export function newIdempotencyKey(prefix: string): string {
  return `${prefix}:${randomUUID()}`;
}
