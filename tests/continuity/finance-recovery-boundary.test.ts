import { describe, expect, it } from "vitest";

import {
  assertNotFinancialApproval,
  FINANCIAL_PROHIBITED_ACTION_SLUGS,
  isFinancialApprovalAttempt,
} from "@/lib/continuity/finance/finance-recovery-service";

describe("financial recovery boundary", () => {
  it("catches every financial approval slug", () => {
    for (const slug of FINANCIAL_PROHIBITED_ACTION_SLUGS) {
      expect(isFinancialApprovalAttempt(slug)).toBe(true);
      expect(() => assertNotFinancialApproval(slug)).toThrow();
    }
  });

  it("does not block a benign continuity action", () => {
    expect(() => assertNotFinancialApproval("continuity.draft_recovery_plan")).not.toThrow();
    expect(isFinancialApprovalAttempt("continuity.explain_options")).toBe(false);
  });

  it("blocks invoice.submit as well as invoice.approve", () => {
    expect(isFinancialApprovalAttempt("invoices.submit")).toBe(true);
    expect(isFinancialApprovalAttempt("invoices.approve")).toBe(true);
  });

  it("blocks claims.submit and claims.approve", () => {
    expect(isFinancialApprovalAttempt("claims.submit")).toBe(true);
    expect(isFinancialApprovalAttempt("claims.approve")).toBe(true);
  });

  it("blocks refunds.approve and credits.issue", () => {
    expect(isFinancialApprovalAttempt("refunds.approve")).toBe(true);
    expect(isFinancialApprovalAttempt("credits.issue")).toBe(true);
  });
});
