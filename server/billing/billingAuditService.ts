import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import type {
  AgenticInvoiceDraft,
  GuardrailDecision,
} from "@/server/billing/billingTypes";

export async function recordInvoiceDraftAudit(params: {
  actorUserId: string;
  draft: AgenticInvoiceDraft;
}): Promise<void> {
  await writeBillingAuditLog({
    actorUserId: params.actorUserId,
    entityType: "AgenticBillingInvoice",
    entityId: params.draft.id,
    action: "agentic_draft_created",
    after: {
      participantId: params.draft.participantId,
      bookingIds: params.draft.bookingIds,
      status: params.draft.status,
      totalCents: params.draft.totalCents,
      lineCount: params.draft.lineItems.length,
      sendBlocked: params.draft.sendBlocked,
      claimSubmissionBlocked: params.draft.claimSubmissionBlocked,
    },
  });
}

export async function recordGuardrailAudit(params: {
  actorUserId?: string;
  invoiceId: string;
  decision: GuardrailDecision;
}): Promise<void> {
  await writeBillingAuditLog({
    actorUserId: params.actorUserId ?? null,
    entityType: "AgenticBillingInvoice",
    entityId: params.invoiceId,
    action: "agentic_guardrails_evaluated",
    after: {
      overallStatus: params.decision.overallStatus,
      requiresApproval: params.decision.requiresApproval,
      canSendOrSubmit: params.decision.canSendOrSubmit,
      checks: params.decision.checks.map((c) => ({
        id: c.id,
        status: c.status,
      })),
      blockReasons: params.decision.blockReasons,
    },
  });
}

export async function recordDisputeAudit(params: {
  actorUserId: string;
  invoiceId: string;
  reason: string;
}): Promise<void> {
  await writeBillingAuditLog({
    actorUserId: params.actorUserId,
    entityType: "AgenticBillingInvoice",
    entityId: params.invoiceId,
    action: "agentic_invoice_disputed",
    after: {
      reasonLength: params.reason.length,
      sendBlocked: true,
    },
  });
}
