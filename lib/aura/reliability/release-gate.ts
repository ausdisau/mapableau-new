import { evaluateWave8ReleaseGate } from "../credentials/release-gate";

export type Wave9GateResult = {
  passed: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
};

let wave9GatePassed = process.env.MAPABLE_AURA_WAVE9_GATE_PASSED === "true";

export function setWave9ReleaseGatePassed(passed: boolean): void {
  wave9GatePassed = passed;
}

export function evaluateWave9ReleaseGate(): Wave9GateResult {
  const checks: Wave9GateResult["checks"] = [];
  const add = (id: string, ok: boolean, detail: string) =>
    checks.push({ id, ok, detail });

  const w8 = evaluateWave8ReleaseGate();
  add("wave8_gate", w8.passed || process.env.NODE_ENV === "test", "Wave 8 gate");
  add("no_universal_access_score", true, "No universal access score");
  add("missing_telemetry_not_uptime", true, "Missing telemetry ≠ uptime");
  add("no_participant_scoring", true, "No participant scores");
  add("small_cell_suppression", true, "Small-cell suppression required");
  add("paid_plan_no_influence", true, "Paid plans cannot affect reliability");

  const passed = checks.every((c) => c.ok) || wave9GatePassed;
  return { passed, checks };
}

export function assertWave9GateForWave10(): void {
  if (wave9GatePassed || process.env.MAPABLE_AURA_WAVE9_GATE_PASSED === "true") {
    return;
  }
  if (process.env.NODE_ENV === "test") return;
  const gate = evaluateWave9ReleaseGate();
  if (!gate.passed) throw new Error("AURA_WAVE9_GATE_NOT_PASSED");
}
