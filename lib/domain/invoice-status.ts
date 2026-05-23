import type { InvoiceStatus as PrismaInvoiceStatus } from "@prisma/client";

/** Canonical Core spine invoice statuses (prompt pack). */
export type CoreInvoiceStatus =
  | "draft"
  | "issued"
  | "awaiting_participant_approval"
  | "awaiting_plan_manager"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "disputed"
  | "void";

export const CORE_INVOICE_STATUSES: CoreInvoiceStatus[] = [
  "draft",
  "issued",
  "awaiting_participant_approval",
  "awaiting_plan_manager",
  "partially_paid",
  "paid",
  "overdue",
  "disputed",
  "void",
];

const PRISMA_TO_CORE: Record<string, CoreInvoiceStatus> = {
  draft: "draft",
  preflight_required: "draft",
  preflight_failed: "draft",
  approved_for_invoicing: "awaiting_participant_approval",
  xero_sync_pending: "issued",
  xero_synced: "issued",
  stripe_payment_pending: "awaiting_plan_manager",
  partially_paid: "partially_paid",
  paid: "paid",
  voided: "void",
  issued: "issued",
  awaiting_participant_approval: "awaiting_participant_approval",
  awaiting_plan_manager: "awaiting_plan_manager",
  overdue: "overdue",
  disputed: "disputed",
};

const CORE_TO_PRISMA: Record<CoreInvoiceStatus, PrismaInvoiceStatus> = {
  draft: "draft",
  issued: "issued",
  awaiting_participant_approval: "awaiting_participant_approval",
  awaiting_plan_manager: "awaiting_plan_manager",
  partially_paid: "partially_paid",
  paid: "paid",
  overdue: "overdue",
  disputed: "disputed",
  void: "voided",
};

const ALLOWED_TRANSITIONS: Record<CoreInvoiceStatus, CoreInvoiceStatus[]> = {
  draft: ["issued", "void", "awaiting_participant_approval"],
  issued: [
    "awaiting_participant_approval",
    "awaiting_plan_manager",
    "partially_paid",
    "paid",
    "overdue",
    "void",
    "disputed",
  ],
  awaiting_participant_approval: [
    "awaiting_plan_manager",
    "partially_paid",
    "paid",
    "disputed",
    "void",
  ],
  awaiting_plan_manager: ["partially_paid", "paid", "overdue", "disputed", "void"],
  partially_paid: ["paid", "overdue", "disputed", "void"],
  paid: [],
  overdue: ["partially_paid", "paid", "disputed", "void"],
  disputed: ["awaiting_participant_approval", "void", "paid"],
  void: [],
};

export function toCoreInvoiceStatus(
  status: string | PrismaInvoiceStatus
): CoreInvoiceStatus {
  return PRISMA_TO_CORE[status] ?? (status as CoreInvoiceStatus);
}

export function toPrismaInvoiceStatus(
  status: CoreInvoiceStatus
): PrismaInvoiceStatus {
  return CORE_TO_PRISMA[status];
}

export function canTransitionInvoiceStatus(
  current: CoreInvoiceStatus | string,
  next: CoreInvoiceStatus | string
): boolean {
  const from = toCoreInvoiceStatus(current);
  const to = toCoreInvoiceStatus(next);
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertInvoiceTransition(
  current: CoreInvoiceStatus | string,
  next: CoreInvoiceStatus | string
): void {
  if (!canTransitionInvoiceStatus(current, next)) {
    throw new Error(
      `INVALID_INVOICE_TRANSITION:${toCoreInvoiceStatus(current)}->${toCoreInvoiceStatus(next)}`
    );
  }
}

export function invoiceStatusLabel(
  status: CoreInvoiceStatus | string
): string {
  const labels: Record<CoreInvoiceStatus, string> = {
    draft: "Draft",
    issued: "Issued",
    awaiting_participant_approval: "Awaiting your approval",
    awaiting_plan_manager: "With plan manager",
    partially_paid: "Partially paid",
    paid: "Paid",
    overdue: "Overdue",
    disputed: "Disputed",
    void: "Void",
  };
  return labels[toCoreInvoiceStatus(status)] ?? String(status);
}
