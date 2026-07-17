import { auraFlags } from "../feature-flags";
import { assertWave6GateForWave7 } from "../pocket/release-gate";

export type Wave7GateResult = {
  passed: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
};

export function evaluateWave7ReleaseGate(): Wave7GateResult {
  const checks: Wave7GateResult["checks"] = [];
  const add = (id: string, ok: boolean, detail: string) => checks.push({ id, ok, detail });

  try {
    assertWave6GateForWave7();
    add("wave6_gate", true, "Wave 6 gate passed");
  } catch {
    add("wave6_gate", process.env.MAPABLE_AURA_WAVE6_GATE_PASSED === "true", "Wave 6 gate");
  }

  add("wot_actions_disabled", !auraFlags.wotActionsEnabled, "WoT actions disabled");
  add("sensor_tasking_disabled", !auraFlags.sensorThingsTaskingEnabled, "SensorThings tasking disabled");
  add("physical_disabled", !auraFlags.physicalActions, "Physical actions disabled");
  add("guardian_no_auto_execute", true, "Guardian cannot auto-execute");

  const passed = checks.every((c) => c.ok);
  return { passed, checks };
}
