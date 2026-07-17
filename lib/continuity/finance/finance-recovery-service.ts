/**
 * Wave 11 — Financial recovery guard.
 *
 * The service_recovery specialist and every AURA agent MUST NOT approve
 * invoices, claims, or payments. Finance recovery paths only produce a
 * summary and hand off to a billing coordinator. This module is the
 * central guard so financial approvals cannot leak through any adapter.
 */

export const FINANCIAL_PROHIBITED_ACTION_SLUGS = new Set([
  "billing.approve_invoice",
  "billing.approve_claim",
  "billing.submit_claim",
  "payments.approve",
  "payments.submit",
  "invoices.approve",
  "invoices.submit",
  "claims.approve",
  "claims.submit",
  "credits.issue",
  "refunds.approve",
]);

export function assertNotFinancialApproval(actionSlug: string): void {
  if (FINANCIAL_PROHIBITED_ACTION_SLUGS.has(actionSlug)) {
    throw new Error(`FINANCE_RECOVERY_PROHIBITED_ACTION_${actionSlug}`);
  }
}

export function isFinancialApprovalAttempt(actionSlug: string): boolean {
  return FINANCIAL_PROHIBITED_ACTION_SLUGS.has(actionSlug);
}
