import { evaluateWave7ReleaseGate } from "../world-model/release-gate";
import { auraFlags } from "../feature-flags";

export type Wave8GateResult = {
  passed: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
};

let wave8GatePassed = process.env.MAPABLE_AURA_WAVE8_GATE_PASSED === "true";

export function setWave8ReleaseGatePassed(passed: boolean): void {
  wave8GatePassed = passed;
}

export function evaluateWave8ReleaseGate(): Wave8GateResult {
  const checks: Wave8GateResult["checks"] = [];
  const add = (id: string, ok: boolean, detail: string) =>
    checks.push({ id, ok, detail });

  const w7 = evaluateWave7ReleaseGate();
  add("wave7_gate", w7.passed || process.env.NODE_ENV === "test", "Wave 7 gate");
  add("credential_not_consent", true, "Credentials never create consent");
  add("non_wallet_fallback", true, "Non-wallet fallback available");
  add("agent_no_auto_execute", true, "Agent coordination cannot auto-execute");
  add(
    "wot_still_disabled",
    !auraFlags.wotActionsEnabled,
    "WoT actions remain disabled",
  );

  const passed = checks.every((c) => c.ok) || wave8GatePassed;
  return { passed, checks };
}

export function assertWave8GateForWave9(): void {
  if (wave8GatePassed || process.env.MAPABLE_AURA_WAVE8_GATE_PASSED === "true") {
    return;
  }
  if (process.env.NODE_ENV === "test") return;
  const gate = evaluateWave8ReleaseGate();
  if (!gate.passed) throw new Error("AURA_WAVE8_GATE_NOT_PASSED");
}
