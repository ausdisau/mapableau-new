import type { PilotDecision, PilotStage, PilotStatus, Prisma } from "@prisma/client";

import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { assertCanTransitionPilotStatus } from "@/lib/pilot/policy/pilot-status";
import { assertCanAdvanceStage } from "@/lib/pilot/progression/stage-transition-policy";
import { prisma } from "@/lib/prisma";

export type RecordPilotDecisionInput = {
  pilotId: string;
  decision: PilotDecision;
  decidedById: string;
  rationale: string;
  toStatus?: PilotStatus;
  toStage?: PilotStage;
  evidenceRefs?: unknown[];
  correlationId?: string;
};

/**
 * Append-only decision recording. No AI auto-approval.
 * Mutates ControlledPilot status/stage only via explicit human decision.
 */
export async function recordPilotDecision(input: RecordPilotDecisionInput) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: input.pilotId },
  });

  const correlationId = input.correlationId ?? createCorrelationId();
  let toStatus = input.toStatus ?? pilot.status;
  let toStage = input.toStage ?? pilot.stage;

  switch (input.decision) {
    case "approve":
      toStatus = "approved";
      break;
    case "reject":
      toStatus = "draft";
      break;
    case "advance_stage":
      if (!input.toStage) {
        throw new Error("ADVANCE_STAGE_REQUIRES_TO_STAGE");
      }
      assertCanAdvanceStage(pilot.stage, input.toStage, pilot);
      toStage = input.toStage;
      if (pilot.status === "approved") toStatus = "active";
      break;
    case "pause":
      toStatus = "paused";
      break;
    case "resume":
      toStatus = "active";
      break;
    case "terminate":
      toStatus = "terminated";
      break;
    case "close":
      toStatus = "closed";
      toStage = "closed";
      break;
    case "require_evidence":
    case "defer":
      break;
    default: {
      const _exhaustive: never = input.decision;
      throw new Error(`UNKNOWN_PILOT_DECISION:${String(_exhaustive)}`);
    }
  }

  if (toStatus !== pilot.status) {
    assertCanTransitionPilotStatus(pilot.status, toStatus);
  }

  const decision = await prisma.$transaction(async (tx) => {
    const record = await tx.pilotDecisionRecord.create({
      data: {
        pilotId: input.pilotId,
        decision: input.decision,
        fromStatus: pilot.status,
        toStatus,
        fromStage: pilot.stage,
        toStage,
        rationale: input.rationale,
        evidenceRefsJson: (input.evidenceRefs ?? []) as Prisma.InputJsonValue,
        decidedById: input.decidedById,
        correlationId,
      },
    });

    const data: Prisma.ControlledPilotUpdateInput = {
      status: toStatus,
      stage: toStage,
      updatedBy: { connect: { id: input.decidedById } },
      safeMetadataJson: sanitiseAuditJson({
        lastDecisionId: record.id,
        lastDecision: input.decision,
      }) as Prisma.InputJsonValue,
    };

    if (toStatus === "active" && !pilot.activatedAt) {
      data.activatedAt = new Date();
    }
    if (toStatus === "paused") {
      data.pausedAt = new Date();
      data.pausedBy = { connect: { id: input.decidedById } };
    }
    if (toStatus === "active" && pilot.status === "paused") {
      data.pausedAt = null;
      data.pauseReason = null;
      data.pausedBy = { disconnect: true };
    }
    if (toStatus === "terminated") {
      data.terminatedAt = new Date();
    }
    if (toStatus === "closed") {
      data.closedAt = new Date();
    }

    await tx.controlledPilot.update({
      where: { id: input.pilotId },
      data,
    });

    return record;
  });

  return decision;
}
