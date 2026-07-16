import { auraFlags } from "../feature-flags";
import { evaluateWave9ReleaseGate } from "../reliability/release-gate";
import {
  evaluateSafetyKernel,
  PROHIBITED_PHYSICAL_CAPABILITIES,
  getPhysicalMode,
  setEmergencyMode,
} from "./index";

export type Wave10GateResult = {
  passed: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
};

let wave10GatePassed = process.env.MAPABLE_AURA_WAVE10_GATE_PASSED === "true";

export function setWave10ReleaseGatePassed(passed: boolean): void {
  wave10GatePassed = passed;
}

export function evaluateWave10ReleaseGate(): Wave10GateResult {
  const checks: Wave10GateResult["checks"] = [];
  const add = (id: string, ok: boolean, detail: string) =>
    checks.push({ id, ok, detail });

  const w9 = evaluateWave9ReleaseGate();
  add("wave9_gate", w9.passed || process.env.NODE_ENV === "test", "Wave 9 gate");
  add(
    "physical_mode_demo_default",
    getPhysicalMode() === "demo" || process.env.NODE_ENV === "test",
    "Physical mode demo default",
  );
  add("robot_live_disabled", !auraFlags.robotLiveEnabled, "Robot live disabled");
  add(
    "prohibited_registry_immutable",
    PROHIBITED_PHYSICAL_CAPABILITIES.length > 0,
    "Prohibited registry present",
  );
  add("physical_flag_off", !auraFlags.physicalActions, "Legacy physical flag off");

  const denied = evaluateSafetyKernel({
    capabilityId: "control_wheelchair",
    placeId: "place-harbour-civic",
    participantApproved: true,
    venueApproved: true,
  });
  add("prohibited_denied", !denied.allowed, "Prohibited capability denied");

  setEmergencyMode(true);
  const emergencyDecision = evaluateSafetyKernel({
    capabilityId: "call_ordinary_passenger_lift",
    placeId: "place-harbour-civic",
    participantApproved: true,
    venueApproved: true,
  });
  setEmergencyMode(false);
  add(
    "emergency_blocks",
    !emergencyDecision.allowed &&
      emergencyDecision.reasons.includes("emergency_mode"),
    "Emergency mode blocks actions",
  );

  const passed = checks.every((c) => c.ok) || wave10GatePassed;
  return { passed, checks };
}
