import type { NdisDocumentStatus } from "@prisma/client";

import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";

const ALLOWED: Record<NdisDocumentStatus, readonly NdisDocumentStatus[]> = {
  draft: ["generated", "failed", "voided"],
  generated: ["pending_approval", "approved", "issued", "failed", "voided"],
  pending_approval: ["approved", "generated", "voided", "failed"],
  approved: ["issued", "mock_delivered", "delivered", "voided"],
  issued: ["delivered", "mock_delivered", "acknowledged", "voided", "superseded"],
  mock_delivered: ["acknowledged", "voided", "superseded"],
  delivered: ["acknowledged", "voided", "superseded"],
  acknowledged: ["superseded", "voided"],
  voided: [],
  superseded: [],
  failed: ["draft", "voided"],
};

export function canTransitionDocumentStatus(
  from: NdisDocumentStatus,
  to: NdisDocumentStatus
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function assertDocumentTransition(
  from: NdisDocumentStatus,
  to: NdisDocumentStatus
): void {
  if (!canTransitionDocumentStatus(from, to)) {
    throw new NdisGatewayError({
      code: "INVALID_STATUS_TRANSITION",
      plainLanguageMessage:
        "This document cannot move to that status from its current status.",
      technicalMessage: `Invalid document transition: ${from} → ${to}`,
    });
  }
}

export const FORBIDDEN_DOCUMENT_TRANSITIONS: ReadonlyArray<
  readonly [NdisDocumentStatus, NdisDocumentStatus]
> = [
  ["draft", "delivered"],
  ["voided", "issued"],
  ["failed", "delivered"],
];
