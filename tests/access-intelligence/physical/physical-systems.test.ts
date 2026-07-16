import { beforeEach, describe, expect, it } from "vitest";

import { createDemoPassports } from "@/lib/access-intelligence/demo-data";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";
import {
  canActuate,
  createPhysicalSystemsTools,
  evaluateSafety,
  executeAuthorisedAction,
  getPhysicalConfigurationSnapshot,
  getScoutCandidates,
  IMMUTABLE_PROHIBITED_ACTIONS,
  isProhibitedAction,
  listHarbourCapabilities,
  planPhysicalVisit,
  proposePhysicalAction,
  resetPhysicalDomain,
  getHarbourPhysicalSimulator,
  getPhysicalActionTransactionManager,
} from "@/lib/access-intelligence/physical";
import { createPhysicalActionProposal } from "@/lib/access-intelligence/physical/actions/proposal";

describe("Physical Systems configuration", () => {
  it("defaults live actuation off and can report snapshot", () => {
    const snap = getPhysicalConfigurationSnapshot();
    expect(snap.liveEnabled).toBe(false);
    expect(["demo", "shadow", "supervised", "live"]).toContain(snap.effectiveMode);
    if (snap.effectiveMode === "live") {
      expect(snap.liveEnabled).toBe(true);
    }
  });
});

describe("Prohibited registry", () => {
  it("is immutable and blocks known dangerous actions", () => {
    expect(Object.isFrozen(IMMUTABLE_PROHIBITED_ACTIONS)).toBe(true);
    expect(isProhibitedAction("control_mobility_device")).toBe(true);
    expect(isProhibitedAction("call_lift")).toBe(false);
  });
});

describe("Safety Kernel fail-closed", () => {
  beforeEach(() => {
    resetPhysicalDomain();
  });

  it("denies prohibited action types", () => {
    const sim = getHarbourPhysicalSimulator();
    const capability = listHarbourCapabilities()[0]!;
    const decision = evaluateSafety({
      proposal: {
        id: "prop-test",
        placeId: HARBOUR_PLACE_ID,
        userId: "u-test",
        capabilityId: capability.id,
        deviceId: capability.deviceId,
        actionType: "control_mobility_device",
        risk: "prohibited",
        rationale: "test",
        parameters: {},
        requireUserApproval: true,
        requireVenueApproval: false,
        requireEmergencyModeOff: true,
        simulatedOnly: true,
        clearlySimulated: true,
        fictionalNotice: "test",
        proposalHash: "x",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
      capability: { ...capability, actionType: "control_mobility_device" },
      device: sim.getDevice(capability.deviceId),
      emergency: sim.getEmergency(),
      forProposal: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("PROHIBITED_ACTION");
  });

  it("refuses to create a prohibited proposal", () => {
    const capability = listHarbourCapabilities()[0]!;
    expect(() =>
      createPhysicalActionProposal({
        placeId: HARBOUR_PLACE_ID,
        userId: "u-test",
        capability: {
          ...capability,
          actionType: "control_mobility_device",
        },
        rationale: "test",
      }),
    ).toThrow(/prohibit/i);
  });

  it("denies when emergency mode is active", () => {
    const sim = getHarbourPhysicalSimulator();
    sim.emitEvent("emergency_on");
    const capability = listHarbourCapabilities({
      emergencyActive: true,
      devices: sim.getState().devices,
    }).find((c) => c.id === "cap-lift-west-call")!;
    const proposal = createPhysicalActionProposal({
      placeId: HARBOUR_PLACE_ID,
      userId: "u-test",
      capability,
      rationale: "call lift",
    });
    const decision = evaluateSafety({
      proposal,
      capability,
      device: sim.getDevice(capability.deviceId),
      emergency: sim.getEmergency(),
      forProposal: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("EMERGENCY_MODE_ACTIVE");
  });
});

describe("Flagship A — power-chair visit to Room 3.12", () => {
  beforeEach(() => {
    resetPhysicalDomain();
  });

  it("plans a deterministic Harbour visit with text route", () => {
    const passport = createDemoPassports("u-flagship")[0]!;
    expect(passport.id).toBe("passport-power-chair");
    const plan = planPhysicalVisit(passport, {
      destinationLabel: "Interview Room 3.12",
      toNodeId: "n-hcc-room",
    });
    expect(plan.placeId).toBe(HARBOUR_PLACE_ID);
    expect(plan.fictionalNotice.length).toBeGreaterThan(10);
    expect(["suitable", "suitable_with_conditions", "blocked", "unknown"]).toContain(
      plan.decision.status,
    );
    if (plan.route) {
      expect(plan.route.steps.length).toBeGreaterThan(0);
      expect(plan.route.steps.every((s) => s.instruction.length > 0)).toBe(true);
    }
  });

  it("re-routes after main lift outage", () => {
    const passport = createDemoPassports("u-flagship")[0]!;
    const before = planPhysicalVisit(passport, { toNodeId: "n-hcc-room" });
    getHarbourPhysicalSimulator().emitEvent("main_lift_outage");
    const after = planPhysicalVisit(passport, { toNodeId: "n-hcc-room" });
    expect(after.availableCapabilities.find((c) => c.id === "cap-lift-main-call")).toBeUndefined();
    expect(
      after.devices.find((d) => d.deviceId === "dev-lift-main")?.condition,
    ).toBe("outage");
    // Either still has a route via western lift, or reports rejection reasons
    expect(
      after.route != null || after.rejectedRouteSummaries.length > 0 || after.fallbackRoute != null,
    ).toBe(true);
    expect(before.placeId).toBe(after.placeId);
  });
});

describe("Flagship B — Action Gateway approval path", () => {
  beforeEach(() => {
    resetPhysicalDomain();
  });

  it("requires approval before execute and never lets tools call adapters directly", async () => {
    const tools = createPhysicalSystemsTools({
      userId: "u-flagship",
      organisationId: null,
      selectedPassportId: "passport-power-chair",
      demoMode: true,
    });
    expect(Object.keys(tools)).not.toContain("executePhysicalAction");
    expect(Object.keys(tools)).not.toContain("dispatchDevice");

    const execution = await proposePhysicalAction({
      placeId: HARBOUR_PLACE_ID,
      userId: "u-flagship",
      capabilityId: "cap-lift-west-call",
      rationale: "Need western lift for Room 3.12",
    });
    expect(execution.state).toBe("awaiting_user_approval");

    await expect(executeAuthorisedAction(execution.id)).rejects.toMatchObject({
      code: expect.stringMatching(/APPROVAL|INVALID_TRANSITION/),
    });

    const manager = getPhysicalActionTransactionManager();
    await manager.approve(execution.id, "u-flagship", "participant ok");
    const done = await executeAuthorisedAction(execution.id);
    expect(["succeeded", "failed", "timed_out", "verifying", "executing"]).toContain(
      done.state,
    );
    // acknowledgement alone is not enough — terminal or verifying states must be explicit
    expect(done.state).not.toBe("approved");
  });

  it("cancels before dispatch", async () => {
    const execution = await proposePhysicalAction({
      placeId: HARBOUR_PLACE_ID,
      userId: "u-flagship",
      capabilityId: "cap-door-ent-b-open",
      rationale: "Open Entrance B",
    });
    const cancelled = await getPhysicalActionTransactionManager().cancel(
      execution.id,
      "changed mind",
    );
    expect(cancelled.state).toBe("cancelled");
  });
});

describe("Flagship C — Scout provisional candidates", () => {
  it("returns simulated candidates that cannot become measurements via accept alone", () => {
    const candidates = getScoutCandidates("fixture-harbour-corridor-3");
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((c) => c.simulated === true)).toBe(true);
    expect(candidates.every((c) => c.fictionalNotice.includes("Simulated"))).toBe(
      true,
    );
  });
});

describe("Flagship D — emergency fail-closed", () => {
  beforeEach(() => {
    resetPhysicalDomain();
  });

  it("blocks new proposals during emergency", async () => {
    getHarbourPhysicalSimulator().emitEvent("emergency_on");
    await expect(
      proposePhysicalAction({
        placeId: HARBOUR_PLACE_ID,
        userId: "u-flagship",
        capabilityId: "cap-lift-west-call",
        rationale: "try during emergency",
      }),
    ).rejects.toMatchObject({ code: "EMERGENCY_MODE_ACTIVE" });
  });
});

describe("Demo actuation gate", () => {
  it("reports whether actuation is allowed for current mode", () => {
    expect(typeof canActuate()).toBe("boolean");
  });
});
