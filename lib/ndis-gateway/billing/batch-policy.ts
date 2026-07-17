import type { NdisBillingRoute } from "@prisma/client";

import {
  allowsMultiParticipantGrouping,
  requiresSingleParticipantInvoice,
} from "@/lib/ndis-gateway/routing/route-policy";

export type BatchPolicyIssue = {
  code: string;
  message: string;
};

export type BatchMemberForPolicy = {
  billableItemId: string;
  participantId: string | null;
  billingRoute: NdisBillingRoute;
  status: string;
  totalCents: number | null;
  paymentHold: boolean;
};

/**
 * Batch policy:
 * - One participant per invoice for self/plan/private
 * - NDIA may group multiple participants
 */
export function evaluateBatchPolicy(input: {
  billingRoute: NdisBillingRoute;
  members: BatchMemberForPolicy[];
}): { ok: boolean; issues: BatchPolicyIssue[] } {
  const issues: BatchPolicyIssue[] = [];

  if (input.members.length === 0) {
    issues.push({
      code: "batch_empty",
      message: "Batch requires at least one billable item.",
    });
    return { ok: false, issues };
  }

  for (const m of input.members) {
    if (m.billingRoute !== input.billingRoute) {
      issues.push({
        code: "batch_route_mismatch",
        message: `Item ${m.billableItemId} has a different billing route.`,
      });
    }
    if (m.paymentHold) {
      issues.push({
        code: "batch_payment_hold",
        message: `Item ${m.billableItemId} is on payment hold.`,
      });
    }
    if (m.status !== "ready" && m.status !== "locked") {
      issues.push({
        code: "batch_item_not_ready",
        message: `Item ${m.billableItemId} status ${m.status} cannot be batched.`,
      });
    }
  }

  if (requiresSingleParticipantInvoice(input.billingRoute)) {
    const participants = new Set(
      input.members.map((m) => m.participantId).filter(Boolean)
    );
    if (participants.size > 1) {
      issues.push({
        code: "batch_multi_participant_forbidden",
        message:
          "Self-managed, plan-managed, and private-pay batches/invoices allow only one participant.",
      });
    }
  }

  if (
    !allowsMultiParticipantGrouping(input.billingRoute) &&
    !requiresSingleParticipantInvoice(input.billingRoute)
  ) {
    // Other routes: keep conservative single-participant grouping
    const participants = new Set(
      input.members.map((m) => m.participantId).filter(Boolean)
    );
    if (participants.size > 1) {
      issues.push({
        code: "batch_multi_participant_not_allowed",
        message: "This billing route does not allow multi-participant batches.",
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
