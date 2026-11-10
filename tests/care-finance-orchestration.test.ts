import { beforeEach, describe, expect, it, vi } from "vitest";

const { careShiftFindFirst, billingInvoiceUpdateMany, deliveryFindUnique, deliveryCreate } =
  vi.hoisted(() => ({
    careShiftFindFirst: vi.fn(),
    billingInvoiceUpdateMany: vi.fn(),
    deliveryFindUnique: vi.fn(),
    deliveryCreate: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careShift: { findFirst: careShiftFindFirst },
    billingInvoice: { updateMany: billingInvoiceUpdateMany },
    integrationDelivery: {
      findUnique: deliveryFindUnique,
      create: deliveryCreate,
    },
    integrationExternalMapping: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    },
    billingIntegrationConnection: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/billing/integrations/xero-facade", () => ({
  syncInvoiceToXero: vi.fn(async () => ({
    ok: true,
    live: false,
    configured: true,
    idempotencyRef: "idem",
    message: "dry stub",
  })),
}));

vi.mock("@/lib/integrations/deputy/roster", () => ({
  createUnpublishedDraftRoster: vi.fn(async () => ({
    status: "dry_run",
    deliveryId: "d1",
  })),
  updateUnpublishedDraftRoster: vi.fn(async () => ({
    status: "dry_run",
    rosterId: "r1",
  })),
}));

import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import {
  assertNoStripeWhenPlanManaged,
  compensateCareFinanceChange,
  runCareFinanceSlice,
} from "@/lib/integrations/orchestration/care-finance-slice";

describe("funding gates", () => {
  it("blocks Stripe Checkout for plan-managed", () => {
    const d = checkoutDecisionForFundingType("ndis_plan_managed");
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("plan_managed");
    expect(() => assertNoStripeWhenPlanManaged("ndis_plan_managed")).toThrow(
      /plan_managed/,
    );
  });

  it("blocks Stripe Checkout for agency-managed", () => {
    const d = checkoutDecisionForFundingType("ndis_agency_managed");
    expect(d.allowed).toBe(false);
    expect(() => assertNoStripeWhenPlanManaged("ndis_agency_managed")).toThrow(
      /agency_managed/,
    );
  });

  it("allows self-managed and private-pay", () => {
    expect(checkoutDecisionForFundingType("ndis_self_managed").allowed).toBe(true);
    expect(checkoutDecisionForFundingType("private_pay").allowed).toBe(true);
  });
});

describe("runCareFinanceSlice", () => {
  beforeEach(() => {
    careShiftFindFirst.mockReset();
    process.env.STRIPE_DIRECT_BOOKING_ENABLED = "true";
    process.env.DEPUTY_ENABLED = "true";
    process.env.MAPABLE_INTEGRATIONS_DRY_RUN = "true";
  });

  it("enforces organisation tenant boundary", async () => {
    careShiftFindFirst.mockResolvedValue(null);
    const status = await runCareFinanceSlice({
      organisationId: "org_a",
      careBookingId: "b1",
      careShiftId: "s1",
      workerProfileId: "w1",
      actorUserId: "u1",
      fundingSourceType: "private_pay",
    });
    expect(status.steps[0]?.state).toBe("failed");
    expect(status.steps[0]?.detail).toMatch(/tenant isolation/i);
  });

  it("runs dry deputy step and requires billing review", async () => {
    careShiftFindFirst.mockResolvedValue({
      id: "s1",
      organisationId: "org_a",
      careBookingId: "b1",
      startAt: new Date(),
      endAt: new Date(Date.now() + 3600_000),
    });
    const status = await runCareFinanceSlice({
      organisationId: "org_a",
      careBookingId: "b1",
      careShiftId: "s1",
      workerProfileId: "w1",
      actorUserId: "u1",
      fundingSourceType: "ndis_plan_managed",
      billingInvoiceId: "inv_1",
    });
    expect(status.humanReviewRequired).toBe(true);
    expect(status.stripeCheckoutEligible).toBe(false);
    const funding = status.steps.find((s) => s.step === "funding_collection");
    expect(funding?.state).toBe("skipped");
    expect(funding?.detail).toMatch(/Plan-manager/i);
  });
});

describe("compensateCareFinanceChange", () => {
  beforeEach(() => {
    careShiftFindFirst.mockReset();
    billingInvoiceUpdateMany.mockReset();
    deliveryFindUnique.mockResolvedValue(null);
    deliveryCreate.mockResolvedValue({ id: "c1" });
    process.env.DEPUTY_ENABLED = "true";
  });

  it("holds invoice and notifies without auto-refund", async () => {
    careShiftFindFirst.mockResolvedValue({
      id: "s1",
      organisationId: "org_a",
      startAt: new Date(),
      endAt: new Date(),
    });
    billingInvoiceUpdateMany.mockResolvedValue({ count: 1 });

    const result = await compensateCareFinanceChange({
      organisationId: "org_a",
      careShiftId: "s1",
      reason: "cancelled",
      actorUserId: "u1",
      holdInvoiceId: "inv_1",
    });

    expect(result.notify).toBe(true);
    expect(result.invoice).toBe("held");
    expect(billingInvoiceUpdateMany).toHaveBeenCalled();
  });
});
