import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createXeroDraftAccrec,
  resetXeroDraftDedupeForTests,
} from "@/lib/integrations/xero/draft-accrec";
import { isXeroDirectEnabled } from "@/lib/integrations/xero/flags";

afterEach(() => {
  vi.unstubAllEnvs();
  resetXeroDraftDedupeForTests();
});

const base = {
  organisationId: "org_1",
  billingInvoiceId: "binv_1",
  contactId: "xero-contact-1",
  accountCode: "200",
  lineDescription: "Reviewed support hours",
  quantity: 2,
  unitAmountCents: 5500,
  currency: "AUD" as const,
  taxType: "OUTPUT",
  dedupeKey: "xero:binv_1:v1",
};

describe("Xero draft ACCREC", () => {
  it("is disabled by default", () => {
    expect(isXeroDirectEnabled({})).toBe(false);
  });

  it("refuses when flag off", async () => {
    const result = await createXeroDraftAccrec(base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.denialReason).toBe("xero_direct_disabled");
  });

  it("creates DRAFT only when enabled (dry-run)", async () => {
    vi.stubEnv("XERO_DIRECT_ENABLED", "true");
    vi.stubEnv("MAPABLE_INTEGRATIONS_DRY_RUN", "true");
    const result = await createXeroDraftAccrec(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("DRAFT");
      expect(result.type).toBe("ACCREC");
      expect(result.authorised).toBe(false);
      expect(result.sent).toBe(false);
      expect(result.dryRun).toBe(true);
    }
  });

  it("blocks duplicate exports", async () => {
    vi.stubEnv("XERO_DIRECT_ENABLED", "true");
    await createXeroDraftAccrec(base);
    const dup = await createXeroDraftAccrec(base);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.denialReason).toBe("duplicate_export");
  });

  it("requires account/contact config", async () => {
    vi.stubEnv("XERO_DIRECT_ENABLED", "true");
    const result = await createXeroDraftAccrec({
      ...base,
      contactId: "",
      dedupeKey: "xero:binv_1:missing",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.denialReason).toBe("missing_contact");
  });
});
