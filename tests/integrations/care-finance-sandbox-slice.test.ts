import { afterEach, describe, expect, it, vi } from "vitest";

import { runCareFinanceSandboxSlice } from "@/lib/integrations/care-finance-sandbox-slice";
import { resetIntegrationOutboxForTests } from "@/lib/integrations/outbox/memory-outbox";
import { resetXeroDraftDedupeForTests } from "@/lib/integrations/xero/draft-accrec";

afterEach(() => {
  vi.unstubAllEnvs();
  resetIntegrationOutboxForTests();
  resetXeroDraftDedupeForTests();
});

const base = {
  organisationId: "org_1",
  careBookingId: "cb_1",
  careShiftId: "cs_1",
  workerProfileId: "wp_1",
  billingInvoiceId: "bi_1",
  fundingBranch: "private_pay" as const,
  startTimestamp: 1_700_000_000,
  endTimestamp: 1_700_003_600,
  unitAmountCents: 6500,
  quantity: 2,
  serviceEvidenceReviewed: true,
  participantBillingReviewed: true,
};

describe("care finance sandbox slice", () => {
  it("requires evidence and billing review", async () => {
    const result = await runCareFinanceSandboxSlice({
      ...base,
      serviceEvidenceReviewed: false,
    });
    expect(result.ok).toBe(false);
    expect(result.humanReviewRequired).toContain(
      "service_or_billing_review_incomplete",
    );
    expect(result.productionClaim).toBe("none");
  });

  it("routes plan-managed away from Stripe Checkout", async () => {
    const result = await runCareFinanceSandboxSlice({
      ...base,
      fundingBranch: "ndis_plan_managed",
    });
    expect(result.stages.collection.status).toBe("plan_manager_invoice_export");
    expect(result.humanReviewRequired).toContain("plan_manager_export_review");
  });

  it("runs deputy + xero drafts when flags on (dry-run)", async () => {
    vi.stubEnv("DEPUTY_ENABLED", "true");
    vi.stubEnv("XERO_DIRECT_ENABLED", "true");
    vi.stubEnv("MAPABLE_INTEGRATIONS_DRY_RUN", "true");
    const result = await runCareFinanceSandboxSlice({
      ...base,
      deputyEmployeeId: 42,
      operationalUnitId: 7,
      xeroContactId: "c1",
      xeroAccountCode: "200",
      xeroTaxType: "OUTPUT",
    });
    expect(result.stages.deputy.status).toBe("draft_unpublished");
    expect(result.stages.xero.status).toBe("draft_accrec");
    expect(result.stages.collection.status).toBe("stripe_flag_off");
    expect(result.productionClaim).toBe("none");
  });
});
