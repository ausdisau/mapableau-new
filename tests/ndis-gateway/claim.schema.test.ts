import { describe, expect, it } from "vitest";

import {
  canonicalClaimStatusSchema,
  canonicalNdisClaimSchema,
  fundingRouteSchema,
} from "@/lib/ndis-gateway/schemas/claim.schema";

describe("gateway Zod boundary schemas", () => {
  it("accepts valid funding routes", () => {
    expect(fundingRouteSchema.parse("ndia_managed")).toBe("ndia_managed");
    expect(fundingRouteSchema.parse("private_pay")).toBe("private_pay");
  });

  it("rejects invalid funding routes", () => {
    expect(() => fundingRouteSchema.parse("agency_managed")).toThrow();
    expect(() => fundingRouteSchema.parse("ndis_agency_managed")).toThrow();
  });

  it("rejects invalid claim statuses", () => {
    expect(() => canonicalClaimStatusSchema.parse("not_a_status")).toThrow();
  });

  it("accepts a minimal valid canonical claim", () => {
    const claim = canonicalNdisClaimSchema.parse({
      schemaVersion: "1",
      status: "draft",
      fundingRoute: "ndia_managed",
      sourceType: "billing_invoice",
      sourceId: "inv_1",
      provider: {
        organisationId: "org_1",
        name: "Example Provider",
        abn: null,
        ndisRegistrationNumber: "4050000001",
        registrationClaimed: true,
      },
      participant: {
        mapableUserId: "user_1",
        ndisNumberMasked: "****0001",
      },
      servicePeriod: { start: "2026-01-01", end: "2026-01-02" },
      lines: [
        {
          lineNumber: 1,
          supportItemCode: "01_011_0107_1_1",
          supportDescription: "Support",
          serviceStartDate: "2026-01-01",
          serviceEndDate: "2026-01-01",
          quantity: 1,
          unitPriceCents: 1000,
          totalCents: 1000,
          gstIncluded: false,
        },
      ],
      totals: {
        subtotalCents: 1000,
        taxCents: 0,
        totalCents: 1000,
        currency: "AUD",
      },
    });
    expect(claim.fundingRoute).toBe("ndia_managed");
    expect(claim.participant.ndisNumberMasked).toBe("****0001");
  });

  it("rejects claim missing lines", () => {
    expect(() =>
      canonicalNdisClaimSchema.parse({
        schemaVersion: "1",
        status: "draft",
        fundingRoute: "ndia_managed",
        sourceType: "manual",
        sourceId: "x",
        provider: {
          organisationId: "org",
          name: "P",
          abn: null,
          ndisRegistrationNumber: null,
          registrationClaimed: false,
        },
        participant: { mapableUserId: "u", ndisNumberMasked: null },
        servicePeriod: { start: "2026-01-01", end: "2026-01-01" },
        lines: [],
        totals: {
          subtotalCents: 0,
          taxCents: 0,
          totalCents: 0,
          currency: "AUD",
        },
      })
    ).toThrow();
  });
});
