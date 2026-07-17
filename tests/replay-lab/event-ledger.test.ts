import { describe, expect, it } from "vitest";

import {
  assertSyntheticEventType,
  createEventLedger,
  createSeededRandom,
  evaluateAssertions,
  resetReplayEventIdSequenceForTests,
} from "@/lib/replay-lab";

function baseFields(runId: string) {
  return {
    simulationId: "sim_test",
    scenarioId: "starting-work-storm",
    runId,
    virtualTimestamp: "2026-09-17T06:45:00.000Z",
    sourceActor: "actor:morgan",
    sourceSystem: "test",
    payloadVersion: 1,
    causalParent: null as string | null,
    correlationId: "c1",
    authorityReference: null as string | null,
    evidenceClass: "synthetic_fixture" as const,
    affectedGoal: "complete_induction",
    visibility: "report" as const,
    redactionClass: "public_synthetic" as const,
    payload: {} as Record<string, unknown>,
  };
}

describe("Replay Lab event ledger", () => {
  it("marks events synthetic and rejects production namespaces", () => {
    resetReplayEventIdSequenceForTests();
    const ledger = createEventLedger({ runId: "r1" });
    const evt = ledger.append({
      ...baseFields("r1"),
      eventType: "mapable.replay.worker.cancelled",
      payload: { minutes_before_departure: 45 },
    });
    expect(evt.synthetic).toBe(true);

    expect(() => assertSyntheticEventType("mapable.care.worker.cancelled")).toThrow(
      /Production namespace|synthetic namespace/,
    );
    expect(() =>
      ledger.append({
        ...baseFields("r1"),
        eventType: "production.trip.confirmed" as never,
      }),
    ).toThrow();
  });

  it("rewinds by reconstructing state without mutating prior events", () => {
    const ledger = createEventLedger({ runId: "r2" });
    const e1 = ledger.append({
      ...baseFields("r2"),
      eventType: "mapable.replay.worker.cancelled",
    });
    const e2 = ledger.append({
      ...baseFields("r2"),
      virtualTimestamp: "2026-09-17T06:47:00.000Z",
      sourceActor: "actor:priya",
      eventType: "mapable.replay.continuity.case_opened",
    });
    const e3 = ledger.append({
      ...baseFields("r2"),
      virtualTimestamp: "2026-09-17T07:35:00.000Z",
      eventType: "mapable.replay.access.lift_unavailable",
    });

    const before = ledger.list().map((e) => e.eventId);
    const rewound = ledger.rewindTo(e2.eventId);
    expect(rewound.state.openContinuityCases).toContain(e2.eventId);
    expect(rewound.state.domainFlags.lift).toBeUndefined();
    expect(ledger.list().map((e) => e.eventId)).toEqual(before);
    expect(ledger.getById(e1.eventId)?.eventType).toBe("mapable.replay.worker.cancelled");
    expect(ledger.reconstructState(2).domainFlags.lift).toBe("unavailable");
    expect(e3.synthetic).toBe(true);
  });

  it("same seed produces identical random sequences", () => {
    const a = createSeededRandom(7);
    const b = createSeededRandom(7);
    const seqA = [a.next(), a.next(), a.nextInt(100)];
    const seqB = [b.next(), b.next(), b.nextInt(100)];
    expect(seqA).toEqual(seqB);
  });

  it("assertions distinguish failed, blocked, and cannot_determine without universal score", () => {
    const ledger = createEventLedger({ runId: "r3" });
    ledger.append({
      ...baseFields("r3"),
      eventType: "mapable.replay.communication.instructions_shared",
    });
    // instructions shared but not acknowledged → failed for transfer assertion
    const scorecard = evaluateAssertions({
      mode: "engineering_regression",
      expected: [
        "communication_requirements_transferred",
        "inaccessible_replacement_rejected",
        "unknown_hoist_not_confirmed",
      ],
      events: ledger.list(),
    });
    expect(scorecard.universalScore).toBeNull();
    expect(
      scorecard.assertionResults.find((r) => r.assertionId === "communication_requirements_transferred")
        ?.state,
    ).toBe("failed");
    expect(
      scorecard.assertionResults.find((r) => r.assertionId === "inaccessible_replacement_rejected")
        ?.state,
    ).toBe("cannot_determine");

    const blockedCard = evaluateAssertions({
      mode: "engineering_regression",
      expected: ["communication_requirements_transferred"],
      events: [],
    });
    expect(blockedCard.assertionResults[0]?.state).toBe("blocked");
  });
});
