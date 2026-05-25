import { describe, expect, it } from "vitest";

import { AGGREGATE_MIN_CELL_SIZE } from "@/lib/unmet-needs/unmet-need-access-policy";
import { labelForNewProvider } from "@/lib/provider-quality/quality-signal-policy";
import { isHighRiskRecovery } from "@/lib/service-recovery/recovery-policy";

describe("resilience policies", () => {
  it("treats worker no-show as high risk", () => {
    expect(isHighRiskRecovery("worker_no_show")).toBe(true);
  });

  it("suppresses small aggregate cells", () => {
    expect(AGGREGATE_MIN_CELL_SIZE).toBeGreaterThanOrEqual(5);
  });

  it("labels new providers fairly", () => {
    expect(labelForNewProvider()).toContain("limited history");
  });
});

describe("quote conversion booking fields", () => {
  it("exports convertQuoteToBooking", async () => {
    const mod = await import("@/lib/quotes/quote-conversion-service");
    expect(typeof mod.convertQuoteToBooking).toBe("function");
  });
});
