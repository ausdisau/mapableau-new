import { describe, expect, it } from "vitest";

import {
  canTransitionInvoiceStatus,
  toCoreInvoiceStatus,
} from "@/lib/domain/invoice-status";

describe("invoice status transitions", () => {
  it("allows draft to issued", () => {
    expect(canTransitionInvoiceStatus("draft", "issued")).toBe(true);
  });

  it("maps legacy approved_for_invoicing", () => {
    expect(toCoreInvoiceStatus("approved_for_invoicing")).toBe(
      "awaiting_participant_approval"
    );
  });

  it("rejects paid to draft", () => {
    expect(canTransitionInvoiceStatus("paid", "draft")).toBe(false);
  });

  it("allows issued to disputed", () => {
    expect(canTransitionInvoiceStatus("issued", "disputed")).toBe(true);
  });
});
