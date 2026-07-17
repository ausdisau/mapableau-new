import { createHash } from "node:crypto";

import type { PlanGraphSpec } from "./graph";
import { validatePlanGraph } from "./graph";

/**
 * Simulation walks a plan without performing any external writes. It is
 * intentionally pure: every tool call is routed through the simulator kind and
 * the simulator MUST refuse to reach any external endpoint.
 */

export interface SimulationInput {
  plan: PlanGraphSpec;
  inputs: Record<string, unknown>;
}

export interface SimulationOutput {
  ok: boolean;
  planValid: boolean;
  errors: string[];
  externalWrites: number;
  wallClockMs: number;
  warnings: string[];
  inputHash: string;
  stepsSimulated: number;
}

export function simulatePlan(input: SimulationInput): SimulationOutput {
  const started = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validation = validatePlanGraph(input.plan);
  if (!validation.valid) {
    for (const err of validation.errors) {
      errors.push(`${err.code}@step${err.step}: ${err.details}`);
    }
  }

  let stepsSimulated = 0;
  for (const step of input.plan.steps) {
    stepsSimulated += 1;
    if (step.toolId && step.toolId.startsWith("mcp:")) {
      // Simulation MUST NOT touch external MCP endpoints. Treat as a warning
      // that the caller must resolve via `execute_zapier_read_action`-style
      // MCP execution — never here.
      warnings.push(
        `step ${step.stepIndex} references external MCP tool '${step.toolId}' — simulator did not call it`
      );
    }
    if (step.toolId && step.toolId.startsWith("a2a:")) {
      warnings.push(
        `step ${step.stepIndex} references A2A peer '${step.toolId}' — simulator only recorded intent`
      );
    }
  }

  const inputHash = hashSimulationInputs(input);
  return {
    ok: errors.length === 0,
    planValid: validation.valid,
    errors,
    externalWrites: 0,
    wallClockMs: Date.now() - started,
    warnings,
    inputHash,
    stepsSimulated,
  };
}

export function hashSimulationInputs(input: SimulationInput): string {
  const canonical = JSON.stringify({
    steps: input.plan.steps.map((s) => ({
      stepIndex: s.stepIndex,
      actionSlug: s.actionSlug,
      toolId: s.toolId ?? null,
      parents: [...s.parents].sort(),
      loopKind: s.loopKind ?? "none",
      loopMaxIterations: s.loopMaxIterations ?? null,
    })),
    inputs: input.inputs,
  });
  return createHash("sha256").update(canonical).digest("hex");
}
