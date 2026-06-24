import type { AgenticInvoiceDraft, BillingGraph, GuardrailDecision } from "@/server/billing/billingTypes";

export interface StoredAgenticInvoice {
  draft: AgenticInvoiceDraft;
  guardrailDecision: GuardrailDecision;
  graph: BillingGraph;
}

const invoices = new Map<string, StoredAgenticInvoice>();

export function saveAgenticInvoice(record: StoredAgenticInvoice): void {
  invoices.set(record.draft.id, record);
}

export function getAgenticInvoice(
  invoiceId: string
): StoredAgenticInvoice | undefined {
  return invoices.get(invoiceId);
}

export function updateAgenticInvoice(
  invoiceId: string,
  updater: (current: StoredAgenticInvoice) => StoredAgenticInvoice
): StoredAgenticInvoice | undefined {
  const current = invoices.get(invoiceId);
  if (!current) return undefined;
  const next = updater(current);
  invoices.set(invoiceId, next);
  return next;
}

export function resetAgenticBillingStoreForTests(): void {
  invoices.clear();
}
