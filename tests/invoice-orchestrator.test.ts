import { describe, expect, it } from "vitest";

import { calculateInvoiceTotals } from "@/lib/invoices/invoice-calculations";
import { canTransitionInvoiceStatus } from "@/lib/domain/invoice-status";

describe("invoice orchestration", () => {
  it("calculates totals with NDIS and gap split", () => {
    const totals = calculateInvoiceTotals([
      {
        quantity: 2,
        unitAmountCents: 5000,
        claimableByNdis: true,
        ndisClaimableAmountCents: 8000,
        privatePayAmountCents: 2000,
      },
    ]);
    expect(totals.subtotalCents).toBe(10000);
    expect(totals.ndisClaimableCents).toBe(8000);
    expect(totals.participantGapCents).toBe(2000);
  });

  it("paid invoice can follow plan manager approval path", () => {
    expect(
      canTransitionInvoiceStatus("awaiting_plan_manager", "paid")
    ).toBe(true);
  });
});
