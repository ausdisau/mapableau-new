import { describe, expect, it } from "vitest";

import { parseCsvToPriceRows } from "@/lib/ndis-pricing/csv-parse";
import { validatePriceRows } from "@/lib/ndis-pricing/catalogue-import-service";
import {
  buildValidationSummary,
  explainWarning,
} from "@/lib/ndis-pricing/plain-language-pricing-explainer";
import { NDIS_DISCLAIMER } from "@/types/ndis-pricing";

describe("NDIS pricing CSV import", () => {
  it("parses header row CSV", () => {
    const rows = parseCsvToPriceRows(
      "code,name,price limit,unit\n01_001_0107_1_1,Assistance with daily life,65.47,hour"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toBe("01_001_0107_1_1");
    expect(rows[0].priceCapCents).toBe(6547);
  });

  it("rejects duplicate codes in validation", () => {
    const errors = validatePriceRows([
      { code: "01", name: "A" },
      { code: "01", name: "B" },
    ]);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("plain-language pricing explainer", () => {
  it("includes participant-friendly copy for price cap warnings", () => {
    const msg = explainWarning(
      {
        code: "price_exceeds_catalogue_cap",
        severity: "warning",
        message: "Technical",
      },
      "participant"
    );
    expect(msg.toLowerCase()).toContain("guide");
  });

  it("uses technical message for admin audience", () => {
    const msg = explainWarning(
      {
        code: "x",
        severity: "warning",
        message: "Fallback",
        technicalMessage: "ADMIN_DETAIL",
      },
      "admin"
    );
    expect(msg).toBe("ADMIN_DETAIL");
  });

  it("states disclaimer is not funding approval", () => {
    expect(NDIS_DISCLAIMER.toLowerCase()).toContain("does not approve funding");
  });
});

describe("validation summaries", () => {
  it("never implies NDIA submission for participants", () => {
    const s = buildValidationSummary(2, 0, "participant");
    expect(s.toLowerCase()).not.toContain("submitted to ndia");
  });
});
