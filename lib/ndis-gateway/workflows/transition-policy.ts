/**
 * Thin wrappers around Wave 4 state machines for billable items, documents, and batches.
 */

import type {
  NdisBillableItemStatus,
  NdisBillingBatchStatus,
  NdisDocumentStatus,
} from "@prisma/client";

import {
  assertBatchTransition,
  canTransitionBatchStatus,
} from "@/lib/ndis-gateway/workflows/batch-state-machine";
import {
  assertBillableItemTransition,
  canTransitionBillableItemStatus,
} from "@/lib/ndis-gateway/workflows/billable-item-state-machine";
import {
  assertDocumentTransition,
  canTransitionDocumentStatus,
} from "@/lib/ndis-gateway/workflows/document-state-machine";

export type WorkflowEntityKind =
  | "ndis_billable_service_item"
  | "ndis_billing_document"
  | "ndis_billing_batch";

export function canTransitionWorkflowStatus(
  entityKind: WorkflowEntityKind,
  from: string,
  to: string
): boolean {
  switch (entityKind) {
    case "ndis_billable_service_item":
      return canTransitionBillableItemStatus(
        from as NdisBillableItemStatus,
        to as NdisBillableItemStatus
      );
    case "ndis_billing_document":
      return canTransitionDocumentStatus(
        from as NdisDocumentStatus,
        to as NdisDocumentStatus
      );
    case "ndis_billing_batch":
      return canTransitionBatchStatus(
        from as NdisBillingBatchStatus,
        to as NdisBillingBatchStatus
      );
    default: {
      const _exhaustive: never = entityKind;
      return _exhaustive;
    }
  }
}

export function assertWorkflowTransition(
  entityKind: WorkflowEntityKind,
  from: string,
  to: string
): void {
  switch (entityKind) {
    case "ndis_billable_service_item":
      assertBillableItemTransition(
        from as NdisBillableItemStatus,
        to as NdisBillableItemStatus
      );
      return;
    case "ndis_billing_document":
      assertDocumentTransition(
        from as NdisDocumentStatus,
        to as NdisDocumentStatus
      );
      return;
    case "ndis_billing_batch":
      assertBatchTransition(
        from as NdisBillingBatchStatus,
        to as NdisBillingBatchStatus
      );
      return;
    default: {
      const _exhaustive: never = entityKind;
      return _exhaustive;
    }
  }
}
