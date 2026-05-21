import { describe, it, expect } from "vitest";

import {
  careShiftLineItems,
  transportTripLineItems,
  combinedCareTransportLineItems,
  marketplaceAssistiveTechLineItems,
} from "@/lib/billing/__tests__/fixtures";
import {
  calculateInvoiceTotals,
  calculatePlatformFeeCents,
  calculateGstCents,
} from "@/lib/billing/calculations";

describe("calculateGstCents", () => {
  it("returns 10% GST when applicable", () => {
    expect(calculateGstCents(10000, true)).toBe(1000);
  });

  it("returns zero when GST not applicable", () => {
    expect(calculateGstCents(10000, false)).toBe(0);
  });
});

describe("calculatePlatformFeeCents", () => {
  it("calculates 5% platform fee by default", () => {
    expect(calculatePlatformFeeCents(10000)).toBe(500);
  });

  it("respects custom basis points", () => {
    expect(calculatePlatformFeeCents(10000, 1000)).toBe(1000);
  });
});

describe("calculateInvoiceTotals", () => {
  it("calculates care shift invoice totals", () => {
    const totals = calculateInvoiceTotals(careShiftLineItems);
    expect(totals.subtotalCents).toBe(13000);
    expect(totals.gstCents).toBe(0);
    expect(totals.platformFeeCents).toBe(650);
    expect(totals.totalCents).toBe(13650);
  });

  it("calculates transport trip invoice totals", () => {
    const totals = calculateInvoiceTotals(transportTripLineItems);
    expect(totals.subtotalCents).toBe(5400);
    expect(totals.totalCents).toBe(5670);
  });

  it("calculates combined care + transport invoice", () => {
    const totals = calculateInvoiceTotals(combinedCareTransportLineItems);
    expect(totals.subtotalCents).toBe(18400);
    expect(totals.platformFeeCents).toBe(920);
    expect(totals.totalCents).toBe(19320);
  });

  it("includes GST on marketplace assistive technology", () => {
    const totals = calculateInvoiceTotals(marketplaceAssistiveTechLineItems);
    expect(totals.subtotalCents).toBe(18900);
    expect(totals.gstCents).toBe(1890);
    expect(totals.platformFeeCents).toBe(945);
    expect(totals.totalCents).toBe(21735);
  });
});
