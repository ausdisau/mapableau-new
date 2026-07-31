import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildBillingGraph, graphToPatch } from "@/server/billing/billingGraph";
import { evaluateBillingGuardrails, guardrailIds } from "@/server/billing/billingGuardrails";
import { buildParticipantBillingSummary } from "@/server/billing/billingExplanationService";
import { resetAgenticBillingStoreForTests } from "@/server/billing/billingStore";
import type { AgenticInvoiceDraft } from "@/server/billing/billingTypes";

vi.mock("@/lib/billing-core/audit", () => ({
  writeBillingAuditLog: vi.fn().mockResolvedValue({ id: "audit-1" }),
}));

function sampleDraft(overrides?: Partial<AgenticInvoiceDraft>): AgenticInvoiceDraft {
  return {
    id: "inv-test-1",
    participantId: "participant-1",
    bookingIds: ["booking-1"],
    fundingContext: "ndis_plan_managed",
    status: "pending_approval",
    currency: "AUD",
    lineItems: [
      {
        id: "line-1",
        bookingId: "booking-1",
        description: "Support service — care visit (2026-05-20)",
        quantity: 1,
        unitAmountCents: 10000,
        totalAmountCents: 10000,
        serviceDate: "2026-05-20T09:00:00.000Z",
        evidence: {
          bookingId: "booking-1",
          evidenceType: "timeline",
          evidenceIds: ["evt-1"],
          summary: "Timeline: Service completed",
        },
      },
    ],
    subtotalCents: 10000,
    totalCents: 10000,
    createdAt: new Date().toISOString(),
    createdByUserId: "user-1",
    sendBlocked: true,
    claimSubmissionBlocked: true,
    ...overrides,
  };
}

describe("MapAble agentic billing guardrails", () => {
  it("includes all required guardrail ids", () => {
    expect(guardrailIds()).toEqual(
      expect.arrayContaining([
        "billing_requires_service_evidence",
        "no_auto_claim_submission",
        "disputed_invoice_requires_human_review",
      ])
    );
    expect(guardrailIds()).toHaveLength(6);
  });

  it("fails when service evidence is missing", () => {
    const draft = sampleDraft({
      lineItems: [
        {
          ...sampleDraft().lineItems[0],
          evidence: {
            bookingId: "booking-1",
            evidenceType: "booking_status",
            evidenceIds: [],
            summary: "No service evidence on record",
          },
        },
      ],
    });
    const decision = evaluateBillingGuardrails(draft);
    expect(decision.canSendOrSubmit).toBe(false);
    expect(decision.requiresApproval).toBe(true);
    expect(
      decision.checks.find((c) => c.id === "billing_requires_service_evidence")
        ?.status
    ).toBe("fail");
    expect(decision.overallStatus).toBe("blocked");
  });

  it("requires human review when disputed", () => {
    const draft = sampleDraft({ status: "disputed" });
    const decision = evaluateBillingGuardrails(draft);
    expect(decision.overallStatus).toBe("requires_human_review");
    expect(
      decision.checks.find((c) => c.id === "disputed_invoice_requires_human_review")
        ?.status
    ).toBe("review");
    expect(decision.canSendOrSubmit).toBe(false);
  });

  it("never allows auto claim submission", () => {
    const decision = evaluateBillingGuardrails(sampleDraft());
    const claimCheck = decision.checks.find(
      (c) => c.id === "no_auto_claim_submission"
    );
    expect(claimCheck?.status).toBe("pass");
    expect(decision.canSendOrSubmit).toBe(false);
  });

  it("flags unusual unit prices for review", () => {
    const draft = sampleDraft({
      lineItems: [
        {
          ...sampleDraft().lineItems[0],
          unitAmountCents: 600_00,
          totalAmountCents: 600_00,
        },
      ],
    });
    const decision = evaluateBillingGuardrails(draft);
    expect(
      decision.checks.find((c) => c.id === "unusual_price_requires_review")
        ?.status
    ).toBe("review");
  });

  it("blocks sensitive descriptions", () => {
    const draft = sampleDraft({
      lineItems: [
        {
          ...sampleDraft().lineItems[0],
          description: "Service related to diagnosis review",
        },
      ],
    });
    const decision = evaluateBillingGuardrails(draft);
    expect(
      decision.checks.find(
        (c) => c.id === "billing_minimum_necessary_information"
      )?.status
    ).toBe("fail");
  });
});

describe("MapAble agentic billing participant summary", () => {
  it("generates participant-visible summary without send capability", () => {
    const draft = sampleDraft();
    const decision = evaluateBillingGuardrails(draft);
    const summary = buildParticipantBillingSummary(draft, decision);
    expect(summary.requiresYourApproval).toBe(true);
    expect(summary.canSendOrSubmit).toBe(false);
    expect(summary.lineSummaries[0].bookingId).toBe("booking-1");
    expect(summary.plainLanguageSummary).toMatch(/does not submit NDIS claims/i);
  });
});

describe("MapAble billing graph", () => {
  it("links bookings, evidence, and line items", () => {
    const draft = sampleDraft();
    const decision = evaluateBillingGuardrails(draft);
    const graph = buildBillingGraph(draft, decision);
    const patch = graphToPatch(graph);
    expect(graph.nodes.some((n) => n.type === "booking")).toBe(true);
    expect(graph.nodes.some((n) => n.type === "evidence")).toBe(true);
    expect(graph.edges.some((e) => e.relation === "supported_by")).toBe(true);
    expect(patch.appendNodes.length).toBeGreaterThan(0);
  });
});

describe("Agentic billing store reset", () => {
  beforeEach(() => {
    resetAgenticBillingStoreForTests();
  });

  it("clears store between tests", async () => {
    const { saveAgenticInvoice, getAgenticInvoice } = await import(
      "@/server/billing/billingStore"
    );
    const draft = sampleDraft();
    const decision = evaluateBillingGuardrails(draft);
    saveAgenticInvoice({
      draft,
      guardrailDecision: decision,
      graph: buildBillingGraph(draft, decision),
    });
    expect(getAgenticInvoice(draft.id)).toBeDefined();
    resetAgenticBillingStoreForTests();
    expect(getAgenticInvoice(draft.id)).toBeUndefined();
  });
});
