import { describe, expect, it } from "vitest";

import {
  createEventLedger,
  createSeededRandom,
  createVirtualClock,
  denyProductionDomainWrite,
  ReplayProductionWriteError,
  runDomainAdapters,
  transportAdapterHandle,
  workforceAdapterHandle,
  type ReplayRunContext,
  loadHarbourStartingWorkScenario,
} from "@/lib/replay-lab";

function ctxWithLedger(runId: string): ReplayRunContext {
  const scenario = loadHarbourStartingWorkScenario();
  const clock = createVirtualClock({
    start: "2026-09-17T00:00:00+10:00",
    timeZone: "Australia/Sydney",
  });
  return {
    scenario,
    clock,
    random: createSeededRandom(1),
    ledger: createEventLedger({ runId }),
    actors: new Map(),
  };
}

describe("Replay Lab domain adapters", () => {
  it("refuses production domain writes", () => {
    expect(() => denyProductionDomainWrite("CareShift")).toThrow(ReplayProductionWriteError);
    expect(() => denyProductionDomainWrite("TransportTrip")).toThrow(ReplayProductionWriteError);
    const ctx = ctxWithLedger("adapter_write_guard");
    expect(() =>
      transportAdapterHandle(
        {
          eventType: "mapable.replay.transport.replacement_proposed",
          sourceActor: "actor:sam",
          payload: { writeToTransportTrip: true, proposalId: "x" },
        },
        ctx,
      ),
    ).toThrow(ReplayProductionWriteError);
  });

  it("rejects inaccessible / unknown-hoist transport proposals", () => {
    const ctx = ctxWithLedger("adapter_transport");
    const extras = transportAdapterHandle(
      {
        eventType: "mapable.replay.transport.replacement_proposed",
        sourceActor: "actor:sam",
        payload: {
          hoist_compatibility: "unknown",
          accessible: false,
          proposalId: "proposal:test-1",
        },
      },
      ctx,
    );
    expect(extras.some((e) => e.eventType === "mapable.replay.transport.trip_rejected")).toBe(
      true,
    );
    expect(
      extras.some((e) => e.eventType === "mapable.replay.system.prohibited_action_blocked"),
    ).toBe(true);
  });

  it("blocks auto-assign on worker cancellation and incomplete competency", () => {
    const ctx = ctxWithLedger("adapter_workforce");
    const cancelExtras = workforceAdapterHandle(
      {
        eventType: "mapable.replay.worker.cancelled",
        sourceActor: "actor:morgan",
        payload: { autoAssignReplacement: true },
      },
      ctx,
    );
    expect(cancelExtras[0]?.payload.reason).toBe("no_automatic_assignment");

    const competencyExtras = workforceAdapterHandle(
      {
        eventType: "mapable.replay.worker.competency_checked",
        sourceActor: "actor:priya",
        payload: {},
      },
      ctx,
      {
        workerId: "actor:replacement",
        firstAidExpired: true,
        aacCourseCompleted: true,
        supervisedObservationEvidence: false,
      },
    );
    expect(competencyExtras[0]?.payload.reason).toBe("incomplete_competency_evidence");
  });

  it("runDomainAdapters appends synthetic-only events and skips duplicates", () => {
    const ctx = ctxWithLedger("adapter_dispatch");
    const proposed = ctx.ledger.append({
      simulationId: "sim",
      scenarioId: ctx.scenario.scenario.id,
      runId: ctx.ledger.runId,
      virtualTimestamp: ctx.clock.nowIso(),
      sourceActor: "actor:sam",
      sourceSystem: "test",
      eventType: "mapable.replay.transport.replacement_proposed",
      payloadVersion: 1,
      causalParent: null,
      correlationId: "c",
      authorityReference: null,
      evidenceClass: "synthetic_fixture",
      affectedGoal: ctx.scenario.goal.outcome,
      visibility: "report",
      redactionClass: "public_synthetic",
      payload: {
        hoist_compatibility: "unknown",
        accessible: false,
        proposalId: "proposal:dup-1",
      },
    });

    const first = runDomainAdapters(proposed, ctx);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((e) => e.synthetic)).toBe(true);

    const second = runDomainAdapters(proposed, ctx);
    expect(second.length).toBe(0);
  });
});
