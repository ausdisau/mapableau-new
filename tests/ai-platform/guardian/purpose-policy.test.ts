import { describe, expect, it } from "vitest";

import {
  evaluatePurposePolicy,
  requiredConsentScopesForPurpose,
} from "@/lib/ai/platform/guardian/purpose-policy";

describe("Guardian purpose policy", () => {
  it("allows registered purposes", () => {
    const r = evaluatePurposePolicy("support_request_analysis");
    expect(r.allowed).toBe(true);
  });

  it("fails closed on unknown purposes", () => {
    const r = evaluatePurposePolicy("sell_leads_to_brokers");
    expect(r.allowed).toBe(false);
    if (r.allowed) return;
    expect(r.reasonCodes).toContain("PURPOSE_NOT_ALLOWED");
  });

  it("prohibits direct marketing purposes (APP 7)", () => {
    const r = evaluatePurposePolicy("direct_marketing");
    expect(r.allowed).toBe(false);
    if (r.allowed) return;
    expect(r.reasonCodes).toContain("PURPOSE_MARKETING_PROHIBITED");
  });

  it("requires care/safeguarding scopes for safeguarding purposes", () => {
    expect(
      requiredConsentScopesForPurpose("safeguarding_classification")
    ).toEqual(expect.arrayContaining(["care.share", "safeguarding.disclose"]));
  });
});
