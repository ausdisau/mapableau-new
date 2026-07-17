import type { NdisBillingBatchStatus } from "@prisma/client";

import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";

const ALLOWED: Record<NdisBillingBatchStatus, readonly NdisBillingBatchStatus[]> = {
  draft: ["validating", "cancelled"],
  validating: ["ready", "failed", "draft", "cancelled"],
  ready: ["preparing", "cancelled"],
  preparing: ["prepared", "failed", "cancelled"],
  prepared: ["closed", "cancelled"],
  failed: ["draft", "cancelled"],
  cancelled: [],
  closed: [],
};

export function canTransitionBatchStatus(
  from: NdisBillingBatchStatus,
  to: NdisBillingBatchStatus
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function assertBatchTransition(
  from: NdisBillingBatchStatus,
  to: NdisBillingBatchStatus
): void {
  if (!canTransitionBatchStatus(from, to)) {
    throw new NdisGatewayError({
      code: "INVALID_STATUS_TRANSITION",
      plainLanguageMessage:
        "This billing batch cannot move to that status from its current status.",
      technicalMessage: `Invalid batch transition: ${from} → ${to}`,
    });
  }
}
