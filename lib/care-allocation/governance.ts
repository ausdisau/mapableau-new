/**
 * Care allocation automation boundaries (separate from transport AV matrix).
 */

export const CARE_ALLOCATION_FRAMEWORK_VERSION = "1.0.0";

export type CareAllocationCapability =
  | "recommend_workers"
  | "conditional_auto_assign"
  | "unconditional_auto_assign";

export const CARE_ALLOCATION_CAPABILITY_MATRIX: Record<
  CareAllocationCapability,
  { allowed: boolean; note: string }
> = {
  recommend_workers: {
    allowed: true,
    note: "Rank workers and create proposals; human or gated auto execution.",
  },
  conditional_auto_assign: {
    allowed: true,
    note: "Auto-execute only when autonomy tier, score, and all gates pass with a single winner.",
  },
  unconditional_auto_assign: {
    allowed: false,
    note: "Explicit product non-goal; always require gates and HITL for exceptions.",
  },
};

export function assertCareAllocationCapability(
  capability: CareAllocationCapability
): void {
  const entry = CARE_ALLOCATION_CAPABILITY_MATRIX[capability];
  if (!entry?.allowed) {
    throw new Error(`CARE_ALLOCATION_CAPABILITY_DENIED:${capability}`);
  }
}
