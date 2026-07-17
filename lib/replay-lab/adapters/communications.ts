import type { ReplayEventAppendInput } from "../event-ledger";
import type { ReplayRunContext } from "../run-context";

import {
  assertNoExternalSideEffect,
  denyProductionDomainWrite,
  REPLAY_ADAPTER_SYNTHETIC_ONLY,
} from "./write-guard";

void REPLAY_ADAPTER_SYNTHETIC_ONLY;

/**
 * Synthetic communications adapter.
 * Tests meaning preservation, AAC requirements, acknowledgement — never sends real messages.
 */
export function communicationsAdapterHandle(
  event: { eventType: string; payload: Record<string, unknown>; sourceActor: string },
  ctx: ReplayRunContext,
): ReplayEventAppendInput[] {
  const extras: ReplayEventAppendInput[] = [];
  const req = ctx.scenario.requirements.communication;

  if (event.eventType === "mapable.replay.communication.requirement_violated") {
    // Record burden — attributed to workflow, not participant complexity.
    extras.push(
      base(ctx, {
        eventType: "mapable.replay.system.prohibited_action_blocked",
        sourceActor: "actor:application_service",
        payload: {
          reason: "communication_requirement_violated",
          one_question_at_a_time: req?.one_question_at_a_time ?? false,
          burdenAttributedTo: ["workflow", "organisation"],
        },
      }),
    );
  }

  if (
    event.eventType === "mapable.replay.communication.instructions_shared" &&
    event.payload.sendExternal === true
  ) {
    assertNoExternalSideEffect("send_communication_instructions");
  }

  if (event.payload.writeToMessageTable === true) {
    denyProductionDomainWrite("Message");
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
    sourceSystem: "replay-lab.adapter.communications",
    payloadVersion: 1,
    causalParent: ctx.ledger.list().at(-1)?.eventId ?? null,
    correlationId: `${ctx.ledger.runId}:comms`,
    authorityReference: null,
    evidenceClass: "synthetic_observation",
    affectedGoal: ctx.scenario.goal.outcome,
    visibility: "report",
    redactionClass: "public_synthetic",
    ...partial,
  };
}
