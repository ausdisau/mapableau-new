import type { ReplayEventAppendInput } from "../event-ledger";
import type { ReplayRunContext } from "../run-context";

import {
  denyProductionDomainWrite,
  REPLAY_ADAPTER_SYNTHETIC_ONLY,
} from "./write-guard";

void REPLAY_ADAPTER_SYNTHETIC_ONLY;

export type SyntheticWorkerEvidence = {
  workerId: string;
  firstAidExpired: boolean;
  aacCourseCompleted: boolean;
  supervisedObservationEvidence: boolean;
};

/**
 * Synthetic workforce adapter — credential/competency checks without writing Worker rows.
 */
export function workforceAdapterHandle(
  event: { eventType: string; payload: Record<string, unknown>; sourceActor: string },
  ctx: ReplayRunContext,
  evidence?: SyntheticWorkerEvidence,
): ReplayEventAppendInput[] {
  if (event.payload.writeToWorkerTable === true || event.payload.writeToCareShift === true) {
    denyProductionDomainWrite(
      event.payload.writeToCareShift === true ? "CareShift" : "Worker",
    );
  }

  const extras: ReplayEventAppendInput[] = [];

  if (event.eventType === "mapable.replay.worker.cancelled") {
    // Cancellation must not auto-assign a replacement.
    if (event.payload.autoAssignReplacement === true) {
      extras.push(
        base(ctx, {
          eventType: "mapable.replay.system.prohibited_action_blocked",
          sourceActor: "actor:application_service",
          payload: {
            action: "auto_assign_replacement",
            reason: "no_automatic_assignment",
            requiresAuthority: true,
          },
        }),
      );
    }
  }

  if (event.eventType === "mapable.replay.worker.competency_checked" && evidence) {
    if (evidence.firstAidExpired || !evidence.supervisedObservationEvidence) {
      extras.push(
        base(ctx, {
          eventType: "mapable.replay.system.prohibited_action_blocked",
          sourceActor: "actor:application_service",
          payload: {
            action: "assign_worker",
            workerId: evidence.workerId,
            firstAidExpired: evidence.firstAidExpired,
            supervisedObservationEvidence: evidence.supervisedObservationEvidence,
            aacCourseCompleted: evidence.aacCourseCompleted,
            reason: "incomplete_competency_evidence",
          },
        }),
      );
    }
  }

  return extras;
}

function base(
  ctx: ReplayRunContext,
  partial: Pick<ReplayEventAppendInput, "eventType" | "sourceActor" | "payload">,
): ReplayEventAppendInput {
  return {
    simulationId: `sim_${ctx.scenario.scenario.id}`,
    scenarioId: ctx.scenario.scenario.id,
    runId: ctx.ledger.runId,
    virtualTimestamp: ctx.clock.nowIso(),
    sourceSystem: "replay-lab.adapter.workforce",
    payloadVersion: 1,
    causalParent: ctx.ledger.list().at(-1)?.eventId ?? null,
    correlationId: `${ctx.ledger.runId}:workforce`,
    authorityReference: null,
    evidenceClass: "synthetic_observation",
    affectedGoal: ctx.scenario.goal.outcome,
    visibility: "report",
    redactionClass: "public_synthetic",
    ...partial,
  };
}
