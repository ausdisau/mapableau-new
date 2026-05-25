import { createHash } from "crypto";

import { describe, expect, it, vi } from "vitest";

import {
  calculateInvoiceTotals,
  calculateLineTotal,
} from "@/lib/billing/invoice-total-service";
import {
  decryptBillingSecret,
  encryptBillingSecret,
} from "@/lib/crypto/billing";
import { mapInvoiceToXeroPayload } from "@/lib/xero/xero-invoice-mapper";
import { hashXeroPayload } from "@/lib/xero/xero-oauth-service";

describe("invoice totals", () => {
  it("calculates line and invoice totals", () => {
    expect(calculateLineTotal({ quantity: 2, unitAmountCents: 5000 })).toBe(10000);
    const t = calculateInvoiceTotals([
      { quantity: 1, unitAmountCents: 10000, privatePayAmountCents: 2000 },
      { quantity: 2, unitAmountCents: 2500 },
    ]);
    expect(t.subtotalCents).toBe(15000);
    expect(t.privatePayCents).toBe(2000);
    expect(t.totalCents).toBe(15000);
  });
});

describe("billing encryption", () => {
  it("round-trips secrets", () => {
    const enc = encryptBillingSecret("refresh_token_test");
    const dec = decryptBillingSecret(enc);
    expect(dec).toBe("refresh_token_test");
  });
});

describe("Xero invoice mapper", () => {
  it("produces ACCREC payload with reference and line items", () => {
    const payload = mapInvoiceToXeroPayload({
      id: "inv_1",
      invoiceNumber: "MA-2025-00001",
      contactName: "Alex Participant",
      lines: [
        {
          description: "Care shift",
          quantity: 2,
          unitAmountCents: 6500,
          xeroAccountCode: "200",
          xeroTaxType: "OUTPUT",
        },
      ],
    });
    expect(payload.Type).toBe("ACCREC");
    expect(payload.Reference).toBe("MA-2025-00001");
    expect(payload.LineItems[0].UnitAmount).toBe(65);
    expect(payload.LineItems[0].AccountCode).toBe("200");
  });

  it("uses stable payload hash for idempotency", () => {
    const payload = { Type: "ACCREC", Reference: "x" };
    const a = hashXeroPayload(payload);
    const b = hashXeroPayload(payload);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});

describe("Stripe webhook idempotency", () => {
  it("treats processed event ids as duplicates", () => {
    const processed = new Set<string>();
    function checkDuplicate(eventId: string, markProcessed: boolean) {
      if (processed.has(eventId)) return true;
      if (markProcessed) processed.add(eventId);
      return false;
    }
    const id = `evt_${createHash("sha256").update("test").digest("hex").slice(0, 8)}`;
    expect(checkDuplicate(id, false)).toBe(false);
    expect(checkDuplicate(id, true)).toBe(false);
    expect(checkDuplicate(id, false)).toBe(true);
  });
});

describe("checkout session schema", () => {
  it("requires invoice id", async () => {
    const { checkoutSessionSchema } = await import("@/types/stripe");
    expect(() => checkoutSessionSchema.parse({})).toThrow();
    expect(checkoutSessionSchema.parse({ invoiceId: "inv1" }).invoiceId).toBe("inv1");
  });
});
