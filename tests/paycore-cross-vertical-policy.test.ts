import { describe, expect, it } from "vitest";

import {
  assessPayoutReadiness,
  classifyProviderEvent,
  fundingRouteFor,
  preparePayCoreInstruction,
  type PayCoreVerifiedContext,
} from "../lib/billing/orchestration/paycore-policy";

const base: PayCoreVerifiedContext = {
  serverAttested: true,
  priceRevision: "catalogue-v1",
  organisationRef: "org-test",
  currency: "AUD",
  lines: [{
    source: { vertical: "marketplace", type: "marketplace_transaction", ref: "opaque-order-1" },
    quantity: 2,
    unitCents: 2500,
    taxCents: 500,
    payerFeeCents: 0,
    evidenceStatus: "verified",
  }],
  funding: "private_card",
  payer: "participant",
  payerApproval: "participant_confirmed",
  authorityReceiptRef: "receipt-test",
  feeApproved: true,
  taxReviewed: true,
  sellerApproved: true,
  deliveryConfirmed: false,
  disputeOpen: false,
  requiresRegulatoryReview: false,
};

describe("MapAble PayCore shared funding-routing policy", () => {
  it("keeps all four service verticals on one typed contract", () => {
    for (const [vertical, sourceType] of [
      ["marketplace", "marketplace_transaction"],
      ["care", "care_shift"],
      ["transport", "transport_trip"],
      ["jobs", "subscription_period"],
    ] as const) {
      const context: PayCoreVerifiedContext = {
        ...base,
        lines: [{
          ...base.lines[0],
          source: { vertical, type: sourceType, ref: "opaque-" + vertical },
        }],
        deliveryConfirmed: true,
        sellerApproved: true,
      };
      const result = preparePayCoreInstruction(context);
      expect(result.vertical).toBe(vertical);
      expect(result.status).toBe("prepared");
      expect(result.executable).toBe(false);
    }
  });

  it("uses canonical cents with tax as a separately reviewed value", () => {
    const result = preparePayCoreInstruction(base);
    expect(result.status).toBe("prepared");
    expect(result.paymentRoute).toBe("psp_hosted_payment_preparation");
    expect(result.subtotalCents).toBe(5000);
    expect(result.taxCents).toBe(500);
    expect(result.totalCents).toBe(5500);
    expect(result.ndiaClaimSubmitted).toBe(false);
    expect(result.fundsHeldByMapAble).toBe(false);
  });

  it("routes plan-managed invoices outside Stripe and avoids automatic NDIA claims", () => {
    const managed = preparePayCoreInstruction({ ...base, funding: "ndis_plan_managed" });
    expect(managed.paymentRoute).toBe("plan_manager_invoice_export");
    expect(managed.executable).toBe(false);
    const agency = preparePayCoreInstruction({ ...base, funding: "ndis_agency_managed" });
    expect(agency.status).toBe("on_hold");
    expect(agency.holds).toContain("REGULATORY_REVIEW");
    expect(agency.ndiaClaimSubmitted).toBe(false);
  });

  it("supports employer invoicing only after organisation approval", () => {
    const context: PayCoreVerifiedContext = {
      ...base,
      payer: "organisation", payerApproval: "organisation_confirmed",
      funding: "employer_funded",
      lines: [{
        ...base.lines[0],
        source: { vertical: "jobs", type: "subscription_period", ref: "opaque-period-1" },
      }],
    };
    const planned = preparePayCoreInstruction(context);
    expect(planned.status).toBe("prepared");
    expect(planned.paymentRoute).toBe("organisation_receivable_invoice");
    expect(preparePayCoreInstruction({ ...context, payerApproval: "missing" }).status).toBe("on_hold");
    expect(preparePayCoreInstruction({ ...context, payer: "participant", payerApproval: "participant_confirmed" }).status).toBe("on_hold");
  });

  it("requires completed service evidence for Care, Transport and employment service", () => {
    for (const [vertical, type] of [
      ["care", "care_shift"],
      ["transport", "transport_trip"],
      ["jobs", "employment_session"],
    ] as const) {
      const result = preparePayCoreInstruction({
        ...base,
        lines: [{ ...base.lines[0], source: { vertical, type, ref: "opaque" } }],
        deliveryConfirmed: false,
      });
      expect(result.holds).toContain("SERVICE_NOT_CONFIRMED");
    }
  });

  it("fails closed for missing provenance, disputed charge and unapproved fee", () => {
    const p = preparePayCoreInstruction({
      ...base, serverAttested: false, feeApproved: false, disputeOpen: true,
      lines: [{ ...base.lines[0], evidenceStatus: "disputed" }],
    });
    expect(p.status).toBe("on_hold");
    expect(p.holds).toContain("UNATTESTED_SOURCE");
    expect(p.holds).toContain("SOURCE_IN_DISPUTE");
    expect(p.holds).toContain("FEE_NOT_APPROVED");
    expect(p.totalCents).toBe(0);
  });

  it("does not infer GST and rejects unsafe numeric amounts", () => {
    const unknownTax = preparePayCoreInstruction({
      ...base, lines: [{ ...base.lines[0], taxCents: null }],
    });
    expect(unknownTax.holds).toContain("TAX_NOT_REVIEWED");
    for (const quantity of [0, -1, 1.1, 101]) {
      const r = preparePayCoreInstruction({
        ...base, lines: [{ ...base.lines[0], quantity }],
      });
      expect(r.status).toBe("on_hold");
      expect(r.holds).toContain("INVALID_AMOUNT");
    }
    const tooBig = preparePayCoreInstruction({ ...base, lines: [{ ...base.lines[0], unitCents: Number.MAX_SAFE_INTEGER }] });
    expect(tooBig.holds).toContain("INVALID_AMOUNT");
  });

  it("refuses mixed verticals in a single financial instruction", () => {
    expect(() => preparePayCoreInstruction({
      ...base,
      lines: [
        ...base.lines,
        { ...base.lines[0], source: { vertical: "transport", type: "transport_trip", ref: "trip" } },
      ],
    })).toThrow();
  });

  it("routes mixed funding for independent human financial assessment", () => {
    const result = preparePayCoreInstruction({ ...base, funding: "mixed" });
    expect(result.status).toBe("on_hold");
    expect(result.paymentRoute).toBe("manual_finance_review");
    expect(result.holds).toContain("FUNDING_ROUTE_INCOMPATIBLE");
  });

  it("never permits payout execution and highlights missing settlement prerequisites", () => {
    const p = assessPayoutReadiness({
      paymentSettledAndReconciled: false,
      recipientOnboardingVerified: true,
      disputeOrRefundOpen: true,
      serviceAttestationPresent: true,
      approvedLicensedRail: false,
    });
    expect(p.allowedToTransfer).toBe(false);
    expect(p.issues).toContain("PAYMENT_NOT_RECONCILED");
    expect(p.issues).toContain("DISPUTE_OR_REFUND_PENDING");
    expect(assessPayoutReadiness({
      paymentSettledAndReconciled: true,
      recipientOnboardingVerified: true,
      disputeOrRefundOpen: false,
      serviceAttestationPresent: true,
      approvedLicensedRail: true,
    }).allowedToTransfer).toBe(false);
  });

  it("rejects malformed webhook provenance and recognises duplicate deliveries", () => {
    const good = {
      eventId: "evt_synthetic_1",
      alreadyProcessed: false,
      verifiedSignature: true,
      expectedEnvironment: "test" as const,
      actualEnvironment: "test" as const,
    };
    expect(classifyProviderEvent(good)).toBe("process");
    expect(classifyProviderEvent({ ...good, alreadyProcessed: true })).toBe("duplicate");
    expect(classifyProviderEvent({ ...good, actualEnvironment: "live" })).toBe("reject");
    expect(classifyProviderEvent({ ...good, verifiedSignature: false })).toBe("reject");
  });

  it("disallows actions that would imply payments or NDIS claims", () => {
    const result = preparePayCoreInstruction(base);
    expect(result.executable).toBe(false);
    expect(result.note).toMatch(/not a payment approval/i);
    expect(fundingRouteFor("grant")).toBe("manual_finance_review");
  });
});
