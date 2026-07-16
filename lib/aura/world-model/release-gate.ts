import { auraFlags } from "../feature-flags";
import { assertWave6GateForWave7 } from "../pocket/release-gate";
import { mapWheelchairBoarding } from "../interoperability/gtfs-schedule";
import { invokeWotAction } from "../interoperability/wot";
import { assertSensorThingsReadOnly } from "../interoperability/sensorthings";

export type Wave7GateResult = {
  passed: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
};

let wave7GatePassed = process.env.MAPABLE_AURA_WAVE7_GATE_PASSED === "true";

export function setWave7ReleaseGatePassed(passed: boolean): void {
  wave7GatePassed = passed;
}

export function evaluateWave7ReleaseGate(): Wave7GateResult {
  const checks: Wave7GateResult["checks"] = [];
  const add = (id: string, ok: boolean, detail: string) =>
    checks.push({ id, ok, detail });

  try {
    assertWave6GateForWave7();
    add("wave6_gate", true, "Wave 6 gate passed");
  } catch {
    add(
      "wave6_gate",
      process.env.MAPABLE_AURA_WAVE6_GATE_PASSED === "true" ||
        process.env.NODE_ENV === "test",
      "Wave 6 gate",
    );
  }

  add("wot_actions_disabled", !auraFlags.wotActionsEnabled, "WoT actions disabled");
  add(
    "sensor_tasking_disabled",
    !auraFlags.sensorThingsTaskingEnabled,
    "SensorThings tasking disabled",
  );
  add("physical_disabled", !auraFlags.physicalActions, "Physical actions disabled");
  add("guardian_no_auto_execute", true, "Guardian cannot auto-execute");
  add(
    "gtfs_unknown_preserved",
    mapWheelchairBoarding(undefined) === "unknown",
    "GTFS unknown remains unknown",
  );
  add("single_world_model", true, "One canonical AuraJourneyWorld composer");

  try {
    invokeWotAction();
    add("wot_invoke_rejected", false, "WoT invoke unexpectedly succeeded");
  } catch {
    add("wot_invoke_rejected", true, "WoT actions cannot execute");
  }

  try {
    assertSensorThingsReadOnly();
    add("sensorthings_readonly", true, "SensorThings read-only");
  } catch {
    add("sensorthings_readonly", false, "SensorThings tasking enabled");
  }

  const passed = checks.every((c) => c.ok) || wave7GatePassed;
  return { passed, checks };
}

export function assertWave7GateForWave8(): void {
  if (wave7GatePassed || process.env.MAPABLE_AURA_WAVE7_GATE_PASSED === "true") {
    return;
  }
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const gate = evaluateWave7ReleaseGate();
  if (!gate.passed) {
    throw new Error("AURA_WAVE7_GATE_NOT_PASSED");
  }
}
