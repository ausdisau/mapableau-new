import { afterEach, describe, expect, it } from "vitest";

import {
  assertModelHasNoDeviceTool,
  assertRobotMissionSimulated,
  cancelTelepresence,
  evaluateSafetyKernel,
  evaluateWave10ReleaseGate,
  executePhysicalAction,
  getPhysicalMode,
  listPhysicalCapabilities,
  PROHIBITED_PHYSICAL_CAPABILITIES,
  resetPhysicalStore,
  setEmergencyMode,
  setGlobalKillSwitch,
  setVenueKillSwitch,
  setWave9ReleaseGatePassed,
  setWave10ReleaseGatePassed,
} from "@/lib/aura";

afterEach(() => {
  resetPhysicalStore();
  setEmergencyMode(false);
  setGlobalKillSwitch(false);
});

describe("Wave 10 — physical Safety Kernel", () => {
  it("defaults to demo mode and lists allowlisted capabilities", () => {
    expect(getPhysicalMode()).toBe("demo");
    expect(listPhysicalCapabilities().length).toBeGreaterThan(0);
    expect(PROHIBITED_PHYSICAL_CAPABILITIES).toContain("control_wheelchair");
  });

  it("denies prohibited capabilities", () => {
    const d = evaluateSafetyKernel({
      capabilityId: "control_wheelchair",
      placeId: "place-harbour-civic",
      participantApproved: true,
      venueApproved: true,
    });
    expect(d.allowed).toBe(false);
    expect(d.modelOverridable).toBe(false);
  });

  it("emergency mode and kill switches fail closed", () => {
    setEmergencyMode(true);
    expect(
      evaluateSafetyKernel({
        capabilityId: "call_ordinary_passenger_lift",
        placeId: "place-harbour-civic",
        participantApproved: true,
        venueApproved: true,
      }).allowed,
    ).toBe(false);
    setEmergencyMode(false);
    setGlobalKillSwitch(true);
    expect(
      evaluateSafetyKernel({
        capabilityId: "activate_captions",
        placeId: "place-harbour-civic",
        participantApproved: true,
        venueApproved: true,
      }).allowed,
    ).toBe(false);
    setGlobalKillSwitch(false);
    setVenueKillSwitch("place-harbour-civic", true);
    expect(
      evaluateSafetyKernel({
        capabilityId: "activate_low_glare_lighting",
        placeId: "place-harbour-civic",
        participantApproved: true,
        venueApproved: true,
      }).allowed,
    ).toBe(false);
  });

  it("demo action succeeds only after postcondition; acknowledgement is not success alone", () => {
    const execution = executePhysicalAction({
      capabilityId: "activate_low_glare_lighting",
      userId: "taylor",
      placeId: "place-harbour-civic",
      participantApproved: true,
      venueApproved: true,
      idempotencyKey: "demo-lighting-1",
    });
    expect(execution.acknowledgementIsNotSuccess).toBe(true);
    expect(execution.simulated).toBe(true);
    expect(execution.state).toBe("succeeded");
    expect(execution.postconditionPassed).toBe(true);
    expect(execution.receiptId).toBeTruthy();
  });

  it("idempotency prevents duplicate commands", () => {
    const a = executePhysicalAction({
      capabilityId: "activate_captions",
      userId: "taylor",
      placeId: "place-harbour-civic",
      participantApproved: true,
      venueApproved: true,
      idempotencyKey: "captions-1",
    });
    const b = executePhysicalAction({
      capabilityId: "activate_captions",
      userId: "taylor",
      placeId: "place-harbour-civic",
      participantApproved: true,
      venueApproved: true,
      idempotencyKey: "captions-1",
    });
    expect(a.id).toBe(b.id);
  });

  it("robot escort remains simulated", () => {
    const execution = executePhysicalAction({
      capabilityId: "dispatch_simulated_robot_escort",
      userId: "taylor",
      placeId: "place-harbour-civic",
      participantApproved: true,
      venueApproved: true,
      idempotencyKey: "robot-1",
    });
    assertRobotMissionSimulated(execution);
    expect(execution.simulated).toBe(true);
  });

  it("telepresence can be cancelled", () => {
    const execution = executePhysicalAction({
      capabilityId: "initiate_supervised_telepresence",
      userId: "taylor",
      placeId: "place-harbour-civic",
      participantApproved: true,
      venueApproved: true,
      idempotencyKey: "tele-1",
    });
    const cancelled = cancelTelepresence(execution.id);
    expect(cancelled.state).toBe("cancelled");
  });

  it("model cannot register device tools", () => {
    expect(() =>
      assertModelHasNoDeviceTool(["readJourneyWorld", "send_device_command"]),
    ).toThrow("AURA_MODEL_DEVICE_TOOL_FORBIDDEN");
  });

  it("Wave 10 gate passes in demo", () => {
    setWave9ReleaseGatePassed(true);
    setWave10ReleaseGatePassed(true);
    expect(evaluateWave10ReleaseGate().passed).toBe(true);
  });
});
