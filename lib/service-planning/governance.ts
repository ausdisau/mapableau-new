import {
  assertCareAllocationCapability,
  CARE_ALLOCATION_CAPABILITY_MATRIX,
  type CareAllocationCapability,
} from "@/lib/care-allocation/governance";
import { AV_CAPABILITY_MATRIX } from "@/lib/av-framework/governance";

export { CARE_ALLOCATION_CAPABILITY_MATRIX, type CareAllocationCapability };
export { assertCareAllocationCapability };

/** Platform-wide: no unconditional auto-dispatch for care or transport. */
export function assertNoUnconditionalAutoDispatch(): void {
  assertCareAllocationCapability("recommend_workers");
  const transportAuto = AV_CAPABILITY_MATRIX.autonomous_dispatch;
  if (transportAuto?.allowed) {
    throw new Error("SERVICE_PLANNING_CAPABILITY_DENIED:autonomous_dispatch");
  }
}

export const SERVICE_PLANNING_FRAMEWORK_VERSION = "1.0.0";

export const SERVICE_PLANNING_PRINCIPLES = [
  "Automated planning produces ranked recommendations only.",
  "Care assignment executes only after gates pass and a human approves (or conditional_auto when all gates pass).",
  "Transport route plans and driver/vehicle assignment require human dispatch — no autonomous assignment.",
  "Admin dispatch console surfaces review_required items; it does not auto-close or auto-assign.",
] as const;
