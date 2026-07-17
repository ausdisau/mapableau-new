import type { ReplayEventAppendInput } from "../event-ledger";
import type { ReplayRunContext } from "../run-context";

import {
  denyProductionDomainWrite,
  REPLAY_ADAPTER_SYNTHETIC_ONLY,
} from "./write-guard";

void REPLAY_ADAPTER_SYNTHETIC_ONLY;

/**
 * Synthetic transport adapter.
 * Rejects inaccessible vehicles and unknown hoist confirmation — never writes TransportTrip.
 */
export function transportAdapterHandle(
  event: { eventType: string; payload: Record<string, unknown>; sourceActor: string },
  ctx: ReplayRunContext,
): ReplayEventAppendInput[] {
  if (
    event.payload.writeToTransportTrip === true ||
    event.payload.writeToTransportBooking === true
  ) {
    denyProductionDomainWrite(
      event.payload.writeToTransportBooking === true ? "TransportBooking" : "TransportTrip",
    );
  }

  const extras: ReplayEventAppendInput[] = [];
  const mobility = ctx.scenario.requirements.mobility;

  if (event.eventType === "mapable.replay.transport.replacement_proposed") {
    const hoist = event.payload.hoist_compatibility;
    const accessible = event.payload.accessible;
    const proposalId =
      typeof event.payload.proposalId === "string"
        ? event.payload.proposalId
        : "proposal:unknown";

    const incompatible =
      accessible === false ||
      hoist === "unknown" ||
      (mobility?.power_chair_transport === true && accessible !== true);

    if (incompatible) {
      extras.push(
        base(ctx, {
          eventType: "mapable.replay.transport.trip_rejected",
          sourceActor: "actor:application_service",
          payload: {
            proposalId,
            reason: "inaccessible_or_unknown_compatibility",
            hoist_compatibility: hoist,
            accessible,
          },
        }),
        base(ctx, {
          eventType: "mapable.replay.system.prohibited_action_blocked",
          sourceActor: "actor:application_service",
          payload: {
            proposalId,
            action: "confirm_trip",
            reason: "unknown_hoist_not_confirmed",
            requiresAuthority: true,
          },
        }),
      );
    }
  }

  if (
    event.eventType === "mapable.replay.transport.trip_confirmed" &&
    (event.payload.hoist_compatibility === "unknown" || event.payload.automatic === true)
  ) {
    extras.push(
      base(ctx, {
        eventType: "mapable.replay.system.prohibited_action_blocked",
        sourceActor: "actor:application_service",
        payload: {
          action: "confirm_trip",
          reason:
            event.payload.automatic === true
              ? "no_automatic_assignment"
              : "unknown_hoist_not_confirmed",
          proposalId: event.payload.proposalId,
        },
      }),
    );
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
    sourceSystem: "replay-lab.adapter.transport",
    payloadVersion: 1,
    causalParent: ctx.ledger.list().at(-1)?.eventId ?? null,
    correlationId: `${ctx.ledger.runId}:transport`,
    authorityReference: null,
    evidenceClass: "synthetic_observation",
    affectedGoal: ctx.scenario.goal.outcome,
    visibility: "report",
    redactionClass: "public_synthetic",
    ...partial,
  };
}
