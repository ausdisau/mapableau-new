import { describe, expect, it } from "vitest";

import { CrossTenantAccessError } from "@/lib/my-day-resilience/events";
import {
  MyDayResilienceEngine,
  createDemoEngine,
} from "@/lib/my-day-resilience/engine";
import {
  isMyDayResilienceEnabled,
  MY_DAY_RESILIENCE_PERMANENT_DENY,
} from "@/lib/my-day-resilience/flags";
import { SYNTHETIC_TENANT_ID } from "@/lib/my-day-resilience/fixtures";
import { reviewCareWorkers, buildCareCriteria } from "@/lib/my-day-resilience/care-adapter";
import { evaluateTransportDisruption, buildBaselineTrip } from "@/lib/my-day-resilience/transport-adapter";

function runToRecovery(transport: "delayed_pickup" | "vehicle_mismatch" = "delayed_pickup") {
  const engine = createDemoEngine(true);
  engine.grantConsent();
  engine.evaluateDependencies();
  engine.injectPreferredWorkerCancellation(transport);
  return engine;
}

describe("My Day Resilience engine (Horizon P07)", () => {
  it("fail-closes when consent is denied", () => {
    const engine = new MyDayResilienceEngine({ consentGranted: false });
    const state = engine.getState();
    expect(state.phase).toBe("blocked");
    expect(state.blockReason).toBe("consent_denied");
    expect(() => engine.evaluateDependencies()).toThrow(/CONSENT_REQUIRED/);
  });

  it("invalidates options when consent is withdrawn mid-flow", () => {
    const engine = runToRecovery();
    engine.withdrawConsent();
    const state = engine.getState();
    expect(state.phase).toBe("blocked");
    expect(state.blockReason).toBe("consent_withdrawn");
    expect(state.proposals).toHaveLength(0);
    expect(() => engine.applyDecision("accept", "proposal_defer_care")).toThrow(
      /CONSENT_REQUIRED/,
    );
  });

  it("denies cross-tenant access to the event log", () => {
    const engine = createDemoEngine(true);
    expect(() => engine.assertTenantAccess("tenant_other")).toThrow(
      CrossTenantAccessError,
    );
    expect(() => engine.assertTenantAccess(SYNTHETIC_TENANT_ID)).not.toThrow();
  });

  it("preserves AAC preferences through care review", () => {
    const criteria = buildCareCriteria({
      communicationNeeds: ["aac", "extra_time"],
      preferredWorkerId: "example-a",
    });
    const reviews = reviewCareWorkers(criteria);
    const preferred = reviews.find((r) => r.workerId === "example-a");
    expect(preferred?.factors.find((f) => f.topic === "Communication access")?.state)
      .toBe("fictional_only");
    const substitute = reviews.find((r) => r.workerId === "example-b");
    expect(substitute?.factors.find((f) => f.topic === "Communication access")?.state)
      .toBe("unknown");
  });

  it("never promotes care candidates to bookable", () => {
    const criteria = buildCareCriteria({
      communicationNeeds: ["aac"],
      preferredWorkerId: "example-a",
    });
    for (const candidate of reviewCareWorkers(criteria)) {
      expect(candidate.canBook).toBe(false);
      expect(candidate.verifiedScreening).toBe(false);
      expect(candidate.synthetic).toBe(true);
    }
  });

  it("flags delayed transport without overwriting consent", () => {
    const engine = runToRecovery("delayed_pickup");
    const state = engine.getState();
    expect(state.consent.granted).toBe(true);
    expect(state.transportRouteStatus).toBe("delayed");
    expect(state.evidence.some((e) => e.id === "ev_delayed_pickup")).toBe(true);
    expect(state.canBook).toBe(false);
  });

  it("flags inaccessible / mismatched transport as unavailable", () => {
    const baseline = buildBaselineTrip({
      linkedStepIds: ["step_work"],
      requiresWheelchairAccessible: true,
    });
    const result = evaluateTransportDisruption("vehicle_mismatch", baseline);
    expect(result.routeStatus).toBe("unavailable");
    expect(result.evidence[0]?.honesty).toBe("unknown");
  });

  it("does not reappear declined substitute proposals", () => {
    const engine = runToRecovery("delayed_pickup");
    const before = engine.getState().proposals.map((p) => p.id);
    const unsuitable = before.find((id) => id.includes("unsuitable") || id === "proposal_substitute_worker");
    expect(unsuitable).toBeTruthy();
    engine.applyDecision("decline", unsuitable);
    const after = engine.getState();
    expect(after.declinedProposalIds).toContain(unsuitable);
    expect(after.proposals.find((p) => p.id === unsuitable)).toBeUndefined();
    // Rebuild must still exclude declined ids
    engine.applyDecision("request_human_help");
    expect(engine.getState().receipt?.rejectedProposalIds).toContain(unsuitable);
  });

  it("withdrawn preferences invalidate dependent recovery choices", () => {
    const engine = runToRecovery();
    engine.withdrawPreferredWorker();
    const state = engine.getState();
    expect(state.excludedWorkerIds).toContain("example-a");
    expect(state.declinedProposalIds).toEqual(
      expect.arrayContaining([
        "proposal_substitute_worker",
        "proposal_unsuitable_substitute",
      ]),
    );
    expect(
      state.proposals.find((p) => p.id === "proposal_substitute_worker"),
    ).toBeUndefined();
  });

  it("blocks irreversible booking/payment attempts", () => {
    const engine = runToRecovery();
    const state = engine.applyDecision(
      "accept",
      "proposal_human_care_escalation",
      "EXECUTE_BOOKING",
    );
    expect(state.blockReason).toBe("irreversible_blocked");
    expect(state.receipt).toBeNull();
    expect(state.canBook).toBe(false);
  });

  it("escalates to human help when requested and issues a receipt", () => {
    const engine = runToRecovery();
    const state = engine.applyDecision("request_human_help");
    expect(["human_escalation", "receipt_issued", "replay_ready"]).toContain(
      // final phase after receipt path
      state.phase === "replay_ready" ? "replay_ready" : state.phase,
    );
    expect(state.phase).toBe("replay_ready");
    expect(state.receipt?.noOperationalChangeMade).toBe(true);
    expect(state.receipt?.canBook).toBe(false);
    expect(state.receipt?.escalationReason).toMatch(/human/i);
  });

  it("replays deterministically from the immutable event log", () => {
    const engine = runToRecovery();
    engine.applyDecision("decline", "proposal_unsuitable_substitute");
    engine.applyDecision("request_human_help");
    const first = engine.replay();
    const second = engine.replay();
    expect(first.equalToLive).toBe(true);
    expect(second.reconstructedPhase).toBe(first.reconstructedPhase);
    expect(second.events.map((e) => e.type)).toEqual(first.events.map((e) => e.type));
  });

  it("hard-disables in production regardless of env flag", () => {
    expect(
      isMyDayResilienceEnabled({
        NODE_ENV: "production",
        MAPABLE_MY_DAY_RESILIENCE_ENABLED: "true",
      }),
    ).toBe(false);
    expect(
      isMyDayResilienceEnabled({
        NODE_ENV: "development",
        MAPABLE_MY_DAY_RESILIENCE_ENABLED: "true",
      }),
    ).toBe(true);
    expect(MY_DAY_RESILIENCE_PERMANENT_DENY.autoBooking).toBe(false);
    expect(MY_DAY_RESILIENCE_PERMANENT_DENY.governmentApi).toBe(false);
    expect(MY_DAY_RESILIENCE_PERMANENT_DENY.externalPayments).toBe(false);
  });

  it("keeps offline summary free of booking claims", () => {
    const engine = runToRecovery();
    engine.applyDecision("request_human_help");
    const summary = engine.offlineSummary();
    expect(summary).toContain("canBook: false");
    expect(summary).toContain("DEMO ONLY");
    expect(summary).not.toMatch(/booking confirmed/i);
  });

  it("does not call or imply a second matching engine score", () => {
    const engine = runToRecovery();
    const json = JSON.stringify(engine.getState());
    expect(json).not.toContain("matchScore");
    expect(json).not.toContain("matching-service");
  });
});
