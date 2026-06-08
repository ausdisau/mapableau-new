import { describe, expect, it } from "vitest";

import { parseRemittanceCsv } from "@/lib/ndia/remittance/remittance-service";
import { validateNdisRegistrationNumber } from "@/lib/provider/ndis-registration-service";
import { buildBillingPlanManagerPayload } from "@/lib/plan-manager/billing-export-bridge";

describe("validateNdisRegistrationNumber", () => {
  it("accepts 9-digit numbers", () => {
    expect(validateNdisRegistrationNumber("4050000001")).toBe(true);
    expect(validateNdisRegistrationNumber("405 000 001")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(validateNdisRegistrationNumber("12345")).toBe(false);
    expect(validateNdisRegistrationNumber("")).toBe(false);
  });
});

describe("parseRemittanceCsv", () => {
  it("parses claim id and amount columns", () => {
    const csv = [
      "externalClaimId,amount,paymentDate",
      "NDIA-123,130.00,2026-01-20",
    ].join("\n");
    const rows = parseRemittanceCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].externalClaimId).toBe("NDIA-123");
    expect(rows[0].amountCents).toBe(13000);
  });
});

describe("buildBillingPlanManagerPayload", () => {
  it("builds canonical export payload", () => {
    const payload = buildBillingPlanManagerPayload({
      id: "inv_1",
      userId: "user_1",
      currency: "AUD",
      subtotalCents: 10000,
      gstCents: 0,
      totalCents: 10000,
      status: "issued",
      dueAt: new Date("2026-02-01"),
      fundingSource: {
        planManagerName: "Acme PM",
        planManagerEmail: "pm@example.com",
        ndisParticipantNumber: "430000000",
      },
      lineItems: [
        {
          description: "Support",
          quantity: 1,
          unitAmountCents: 10000,
          totalCents: 10000,
          ndisLineItem: "01_011_0107_1_1",
        },
      ],
    });
    expect(payload.planManager.email).toBe("pm@example.com");
    expect(payload.lineItems).toHaveLength(1);
    expect(payload.emailSubject).toContain("inv_1".slice(0, 8));
  });
});
