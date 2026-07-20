import { z } from "zod";

import { pbsConfig, requirePbsEnabled } from "@/lib/config/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

import {
  assertPbsAccess,
  evaluatePbsAccess,
  type PbsEngagementAccessContext,
} from "./access";
import { createPbsCorrelationId, emitPbsAuditEvent } from "./audit";
import { defaultPbsAssistanceEngine } from "./assistance-engine";
import type { PbsAccessActor, PbsAssistanceAction } from "./types";
import { PBS_QUESTIONNAIRE_VERSION } from "./questionnaire";

const CreateEngagementSchema = z.object({
  organisationId: z.string().min(1),
  participantUserId: z.string().min(1),
  providerProfileId: z.string().optional(),
  assignedPractitionerProfileId: z.string().optional(),
});

export async function createPbsEngagement(params: {
  actor: PbsAccessActor;
  input: z.infer<typeof CreateEngagementSchema>;
  /** Server-derived — never trust client-only org membership. */
  actorOrganisationIds: string[];
}) {
  requirePbsEnabled();
  const parsed = CreateEngagementSchema.parse(params.input);
  if (!params.actorOrganisationIds.includes(parsed.organisationId)) {
    throw new Error("Organisation not in actor membership");
  }

  const decision = evaluatePbsAccess(
    { ...params.actor, organisationIds: params.actorOrganisationIds },
    {
      participantUserId: parsed.participantUserId,
      organisationId: parsed.organisationId,
      assignedPractitionerUserId: params.actor.userId,
      implementingOrganisationId: null,
    },
    { needsClinical: true, action: "engagement.create" },
  );
  // Participant may create for self; practitioner within org may create when assigned
  if (
    params.actor.userId !== parsed.participantUserId &&
    !params.actorOrganisationIds.includes(parsed.organisationId)
  ) {
    assertPbsAccess(decision);
  }

  const correlationId = createPbsCorrelationId();
  const engagement = await prisma.pbsEngagement.create({
    data: {
      organisationId: parsed.organisationId,
      participantUserId: parsed.participantUserId,
      providerProfileId: parsed.providerProfileId,
      assignedPractitionerProfileId: parsed.assignedPractitionerProfileId,
      status: "draft",
      sourceChecklistVersion: "pbs-rp-checklist-v1-2026-05",
    },
  });

  await emitPbsAuditEvent({
    actorUserId: params.actor.userId,
    action: "engagement.created",
    entityType: "PbsEngagement",
    entityId: engagement.id,
    participantId: engagement.participantUserId,
    organisationId: engagement.organisationId,
    correlationId,
    metadata: { status: engagement.status },
  });

  return engagement;
}

export async function createQuestionnaireSession(params: {
  actor: PbsAccessActor;
  engagementId: string;
  accessCtx: PbsEngagementAccessContext;
  easyReadMode?: boolean;
}) {
  requirePbsEnabled();
  const decision = evaluatePbsAccess(params.actor, params.accessCtx, {
    needsClinical: true,
    action: "questionnaire.write",
  });
  assertPbsAccess(decision);

  const engagement = await prisma.pbsEngagement.findUniqueOrThrow({
    where: { id: params.engagementId },
  });

  const session = await prisma.pbsQuestionnaireSession.create({
    data: {
      engagementId: engagement.id,
      organisationId: engagement.organisationId,
      participantUserId: engagement.participantUserId,
      questionnaireVersion: PBS_QUESTIONNAIRE_VERSION,
      easyReadMode: params.easyReadMode ?? false,
      autosaveStatus: "idle",
    },
  });

  await emitPbsAuditEvent({
    actorUserId: params.actor.userId,
    action: "questionnaire.session_created",
    entityType: "PbsQuestionnaireSession",
    entityId: session.id,
    participantId: engagement.participantUserId,
    organisationId: engagement.organisationId,
    correlationId: createPbsCorrelationId(),
    metadata: { questionnaireVersion: PBS_QUESTIONNAIRE_VERSION },
  });

  return session;
}

export async function runPbsAssistance(params: {
  actor: PbsAccessActor;
  engagementId: string;
  organisationId: string;
  participantUserId: string;
  action: PbsAssistanceAction;
  accessCtx: PbsEngagementAccessContext;
  unansweredSectionKeys?: string[];
}) {
  requirePbsEnabled();
  if (!pbsConfig.aiAssistanceEnabled) {
    throw new Error("PBS AI assistance is disabled");
  }
  const decision = evaluatePbsAccess(params.actor, params.accessCtx, {
    needsClinical: true,
    action: "ai.assist",
  });
  assertPbsAccess(decision);

  const result = await defaultPbsAssistanceEngine.run({
    action: params.action,
    engagementId: params.engagementId,
    unansweredSectionKeys: params.unansweredSectionKeys,
  });

  const run = await prisma.pbsAiAssistanceRun.create({
    data: {
      engagementId: params.engagementId,
      organisationId: params.organisationId,
      requesterUserId: params.actor.userId,
      action: result.action,
      authorityCeiling: result.authorityCeiling,
      provider: result.provider,
      model: result.model,
      promptVersion: result.promptVersion,
      inputHash: result.inputHash,
      outputHash: result.outputHash,
      unknownsJson: result.unknowns,
      conflictsJson: result.conflicts,
      externalModelUsed: false,
    },
  });

  await emitPbsAuditEvent({
    actorUserId: params.actor.userId,
    action: "ai.assistance_run",
    entityType: "PbsAiAssistanceRun",
    entityId: run.id,
    participantId: params.participantUserId,
    organisationId: params.organisationId,
    correlationId: createPbsCorrelationId(),
    metadata: {
      action: result.action,
      authorityCeiling: result.authorityCeiling,
      inputHash: result.inputHash,
      outputHash: result.outputHash,
    },
  });

  return { run, result };
}
