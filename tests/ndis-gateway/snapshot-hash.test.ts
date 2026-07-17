import { describe, expect, it } from "vitest";

import { pilotApprovalIsNotClaimAuthority } from "@/lib/ndis-gateway/security/claim-approval-service";
import { sanitiseForLog } from "@/lib/ndis-gateway/security/log-sanitiser";
import {
  hashCanonicalClaimIdentity,
  payloadContainsRawNdisNumber,
  toMaskedClaimPayload,
  type ExternalClaimPayload,
} from "@/lib/ndis-gateway/security/sensitive-payload";

const baseIdentity = {
  organisationId: "org_1",
  participantId: "user_1",
  fundingRoute: "ndia_managed",
  supportItemCodes: ["01_011_0107_1_1"],
  servicePeriod: { start: "2026-01-01", end: "2026-01-02" },
  lines: [
    {
      supportItemCode: "01_011_0107_1_1",
      serviceDate: "2026-01-01",
      quantity: 2,
      unitPriceCents: 1000,
      totalCents: 2000,
    },
  ],
  totals: { totalCents: 2000, currency: "AUD" },
};

describe("claim snapshot hashing and masking", () => {
  it("creates identical hash for identical canonical claims", () => {
    expect(hashCanonicalClaimIdentity(baseIdentity)).toBe(
      hashCanonicalClaimIdentity({ ...baseIdentity })
    );
  });

  it("changes hash when quantity, price, date or support item changes", () => {
    const base = hashCanonicalClaimIdentity(baseIdentity);
    expect(
      hashCanonicalClaimIdentity({
        ...baseIdentity,
        lines: [{ ...baseIdentity.lines[0]!, quantity: 3, totalCents: 3000 }],
        totals: { totalCents: 3000, currency: "AUD" },
      })
    ).not.toBe(base);
    expect(
      hashCanonicalClaimIdentity({
        ...baseIdentity,
        lines: [{ ...baseIdentity.lines[0]!, unitPriceCents: 1100, totalCents: 2200 }],
        totals: { totalCents: 2200, currency: "AUD" },
      })
    ).not.toBe(base);
    expect(
      hashCanonicalClaimIdentity({
        ...baseIdentity,
        lines: [{ ...baseIdentity.lines[0]!, serviceDate: "2026-01-03" }],
      })
    ).not.toBe(base);
    expect(
      hashCanonicalClaimIdentity({
        ...baseIdentity,
        supportItemCodes: ["99_999_9999_1_1"],
        lines: [{ ...baseIdentity.lines[0]!, supportItemCode: "99_999_9999_1_1" }],
      })
    ).not.toBe(base);
  });

  it("masks raw NDIS numbers from ordinary payloads", () => {
    const payload: ExternalClaimPayload = {
      claimType: "registered_provider",
      provider: {
        abn: null,
        ndisRegistrationNumber: "4050000001",
        organisationId: "org_1",
        name: "Provider",
      },
      participant: {
        ndisNumber: "430000123",
        ndisNumberMasked: null,
        mapableUserId: "user_1",
      },
      invoiceReference: {},
      servicePeriod: { start: "2026-01-01", end: "2026-01-01" },
      lines: [
        {
          lineNumber: 1,
          supportItemCode: "01_011_0107_1_1",
          description: "Support",
          serviceDate: "2026-01-01",
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
      metadata: { builtAt: "2026-01-01T00:00:00.000Z", mapableVersion: "1" },
    };

    expect(payloadContainsRawNdisNumber(payload)).toBe(true);
    const masked = toMaskedClaimPayload(payload);
    expect(masked.participant.ndisNumber).toBeNull();
    expect(masked.participant.ndisNumberMasked).toBe("****0123");
    expect(payloadContainsRawNdisNumber(masked)).toBe(false);
  });

  it("sanitises audit/log payloads", () => {
    const clean = sanitiseForLog({
      after: { ndisNumber: "430000123", status: "submitted" },
    });
    expect(JSON.stringify(clean)).not.toContain("430000123");
  });

  it("documents that pilot approval is not claim authority", () => {
    expect(pilotApprovalIsNotClaimAuthority()).toBe(true);
  });
});
