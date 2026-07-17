import { describe, expect, it } from "vitest";

import {
  assertNonNegativeCents,
  assertPositiveCents,
  multiplyQuantityCents,
  sumCents,
} from "@/lib/ndis-gateway/billing/money";
import { buildBillableSourceKey } from "@/lib/ndis-gateway/billing/source-key";
import { validateBillableItemDraft } from "@/lib/ndis-gateway/billing/billable-item-validator";
import { canTransitionBillableItemStatus } from "@/lib/ndis-gateway/workflows/billable-item-state-machine";
import {
  billingRouteToPaymentRoute,
  defaultPaymentDestination,
} from "@/lib/ndis-gateway/routing/route-policy";
import { australianFinancialYear } from "@/lib/ndis-gateway/documents/document-number-service";

describe("Wave 4 money", () => {
  it("multiplies quantity without floating point drift", () => {
    expect(multiplyQuantityCents("1.5", 3333)).toBe(5000);
    expect(multiplyQuantityCents(2, 1250)).toBe(2500);
  });

  it("rejects non-integer cents", () => {
    expect(() => multiplyQuantityCents(1, 12.5)).toThrow(/INTEGER/);
    expect(() => assertPositiveCents(0)).toThrow(/POSITIVE/);
    expect(assertNonNegativeCents(0)).toBe(0);
  });

  it("sums integer cents", () => {
    expect(sumCents([100, 200, 3])).toBe(303);
  });
});

describe("Wave 4 source key", () => {
  it("is deterministic", () => {
    const a = buildBillableSourceKey({
      organisationId: "org1",
      participantId: "p1",
      sourceType: "booking",
      sourceId: "b1",
      chargeType: "support",
      serviceStartAtIso: "2026-07-01T00:00:00.000Z",
      supportItemCode: "01_011_0107_1_1",
      correctionGeneration: 0,
    });
    const b = buildBillableSourceKey({
      organisationId: "org1",
      participantId: "p1",
      sourceType: "booking",
      sourceId: "b1",
      chargeType: "support",
      serviceStartAtIso: "2026-07-01T00:00:00.000Z",
      supportItemCode: "01_011_0107_1_1",
      correctionGeneration: 0,
    });
    expect(a).toBe(b);
    expect(a).not.toContain("PENDING");
  });
});

describe("Wave 4 billable validator", () => {
  it("rejects PENDING_CODE and zero price", () => {
    const pending = validateBillableItemDraft({
      billingRoute: "ndis_plan_managed",
      supportItemCode: "PENDING_CODE",
      participantId: "p1",
      serviceStartAt: new Date("2026-07-01T09:00:00Z"),
      serviceEndAt: new Date("2026-07-01T10:00:00Z"),
      unitPriceCents: 1000,
    });
    expect(pending.valid).toBe(false);
    expect(
      pending.blockingIssues.some((i) => /PENDING/i.test(i.code + i.message))
    ).toBe(true);

    const zero = validateBillableItemDraft({
      billingRoute: "ndis_self_managed",
      supportItemCode: "01_011_0107_1_1",
      participantId: "p1",
      serviceStartAt: new Date("2026-07-01T09:00:00Z"),
      serviceEndAt: new Date("2026-07-01T10:00:00Z"),
      unitPriceCents: 0,
    });
    expect(zero.valid).toBe(false);
  });

  it("allows zero for explicit pro bono", () => {
    const ok = validateBillableItemDraft({
      billingRoute: "pro_bono",
      supportItemCode: null,
      participantId: "p1",
      serviceStartAt: new Date("2026-07-01T09:00:00Z"),
      serviceEndAt: new Date("2026-07-01T10:00:00Z"),
      unitPriceCents: 0,
      allowZeroPriceReason: "pro_bono",
    });
    expect(ok.valid).toBe(true);
  });
});

describe("Wave 4 state machine", () => {
  it("forbids draft to paid and voided to ready", () => {
    expect(canTransitionBillableItemStatus("draft", "paid")).toBe(false);
    expect(canTransitionBillableItemStatus("voided", "ready")).toBe(false);
    expect(canTransitionBillableItemStatus("draft", "evidence_pending")).toBe(
      true
    );
  });
});

describe("Wave 4 route policy", () => {
  it("maps billing routes and destinations", () => {
    expect(billingRouteToPaymentRoute("ndis_ndia_managed")).toBe("ndia_managed");
    expect(billingRouteToPaymentRoute("private_pay")).toBeNull();
    expect(defaultPaymentDestination("ndis_plan_managed")).toBe("plan_manager");
    expect(defaultPaymentDestination("ndis_ndia_managed")).toBe(
      "ndia_portal_export"
    );
    expect(defaultPaymentDestination("pro_bono")).toBe("no_payment");
  });
});

describe("Wave 4 document numbering FY", () => {
  it("uses Australian financial year labelled by ending calendar year", () => {
    expect(australianFinancialYear(new Date("2026-06-30T02:00:00.000Z"))).toBe(
      2026
    );
    expect(australianFinancialYear(new Date("2026-07-01T02:00:00.000Z"))).toBe(
      2027
    );
  });
});
