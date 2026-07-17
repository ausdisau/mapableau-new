import type { WorkerClearanceStatus } from "@prisma/client";

import { pendingClearanceIsEligible } from "@/lib/ndis-platform-trust/worker-clearance/clearance-policy";

export function assertClearanceNotEligibleWhenPending(
  status: WorkerClearanceStatus
): void {
  if (status === "pending" || status === "not_started") {
    if (pendingClearanceIsEligible(status)) {
      throw new Error("PENDING_CLEARANCE_MUST_NOT_BE_ELIGIBLE");
    }
  }
}
