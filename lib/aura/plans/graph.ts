/**
 * Plan graph invariants. AURA plans are DAGs, not free-form loops or unbounded
 * chains. `validatePlanGraph` enforces:
 *
 *  - Every referenced tool/action is present in the manifest allow-list
 *  - Every parent id refers to an earlier step
 *  - No cycles
 *  - Bounded step count and depth
 *  - No unbounded loop constructs (a `whileTrue`-style step is disallowed)
 */

import { auraConfig } from "@/lib/aura/config";

export interface PlanStepSpec {
  stepIndex: number;
  actionSlug: string;
  toolId?: string | null;
  parents: number[];
  loopKind?: "none" | "bounded" | "unbounded";
  loopMaxIterations?: number;
}

export interface PlanGraphSpec {
  steps: PlanStepSpec[];
  allowedActionSlugs: string[];
  allowedToolIds: string[];
}

export type PlanValidationError =
  | { code: "unknown_action"; step: number; details: string }
  | { code: "unknown_tool"; step: number; details: string }
  | { code: "unknown_parent"; step: number; details: string }
  | { code: "forward_reference"; step: number; details: string }
  | { code: "cycle_detected"; step: number; details: string }
  | { code: "step_cap_exceeded"; step: number; details: string }
  | { code: "depth_cap_exceeded"; step: number; details: string }
  | { code: "unbounded_loop"; step: number; details: string }
  | { code: "loop_iteration_cap_missing"; step: number; details: string }
  | { code: "duplicate_step_index"; step: number; details: string };

export interface PlanValidationResult {
  valid: boolean;
  errors: PlanValidationError[];
  depth: number;
}

export function validatePlanGraph(spec: PlanGraphSpec): PlanValidationResult {
  const errors: PlanValidationError[] = [];
  const seenIndices = new Set<number>();

  if (spec.steps.length > auraConfig.planStepCap) {
    errors.push({
      code: "step_cap_exceeded",
      step: spec.steps.length,
      details: `plan has ${spec.steps.length} steps; cap is ${auraConfig.planStepCap}`,
    });
  }

  const byIndex = new Map<number, PlanStepSpec>();
  for (const step of spec.steps) {
    if (seenIndices.has(step.stepIndex)) {
      errors.push({
        code: "duplicate_step_index",
        step: step.stepIndex,
        details: `stepIndex ${step.stepIndex} used more than once`,
      });
    }
    seenIndices.add(step.stepIndex);
    byIndex.set(step.stepIndex, step);
    if (!spec.allowedActionSlugs.includes(step.actionSlug)) {
      errors.push({
        code: "unknown_action",
        step: step.stepIndex,
        details: `action '${step.actionSlug}' is not allowed by manifest`,
      });
    }
    if (step.toolId && !spec.allowedToolIds.includes(step.toolId)) {
      errors.push({
        code: "unknown_tool",
        step: step.stepIndex,
        details: `tool '${step.toolId}' is not allowed`,
      });
    }
    if (step.loopKind === "unbounded") {
      errors.push({
        code: "unbounded_loop",
        step: step.stepIndex,
        details:
          "AURA rejects unbounded loops — every iterative construct must declare a max iteration count.",
      });
    }
    if (step.loopKind === "bounded" && (step.loopMaxIterations ?? 0) <= 0) {
      errors.push({
        code: "loop_iteration_cap_missing",
        step: step.stepIndex,
        details:
          "bounded loop must declare a positive `loopMaxIterations` value.",
      });
    }
    for (const parent of step.parents) {
      if (!byIndex.has(parent) && parent < step.stepIndex) {
        errors.push({
          code: "unknown_parent",
          step: step.stepIndex,
          details: `parent stepIndex ${parent} not declared before this step`,
        });
      }
      if (parent >= step.stepIndex) {
        errors.push({
          code: "forward_reference",
          step: step.stepIndex,
          details: `parent ${parent} is not earlier than this step (${step.stepIndex})`,
        });
      }
    }
  }

  // Topological sort to detect cycles + compute depth.
  const graph = new Map<number, number[]>();
  for (const step of spec.steps) {
    graph.set(step.stepIndex, step.parents);
  }
  const depthMemo = new Map<number, number>();
  const stack = new Set<number>();
  let maxDepth = 0;
  function walk(idx: number): number {
    if (depthMemo.has(idx)) return depthMemo.get(idx)!;
    if (stack.has(idx)) {
      errors.push({
        code: "cycle_detected",
        step: idx,
        details: `cycle involving step ${idx}`,
      });
      return -1;
    }
    stack.add(idx);
    const parents = graph.get(idx) ?? [];
    let d = 0;
    for (const p of parents) {
      d = Math.max(d, walk(p) + 1);
    }
    stack.delete(idx);
    depthMemo.set(idx, d);
    maxDepth = Math.max(maxDepth, d);
    return d;
  }
  for (const step of spec.steps) walk(step.stepIndex);

  if (maxDepth > auraConfig.planDepthCap) {
    errors.push({
      code: "depth_cap_exceeded",
      step: -1,
      details: `plan depth ${maxDepth} exceeds cap ${auraConfig.planDepthCap}`,
    });
  }

  return { valid: errors.length === 0, errors, depth: maxDepth };
}
