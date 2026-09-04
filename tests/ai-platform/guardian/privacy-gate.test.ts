import { describe, expect, it } from "vitest";

import { evaluatePrivacyGate } from "@/lib/ai/platform/guardian/privacy-gate";

describe("Guardian privacy gate", () => {
  it("allows authorised, consented, same-tenant requests", () => {
    const r = evaluatePrivacyGate({
      purpose: "support_request_analysis",
      actorId: "a1",
      actorTenantId: "t1",
      tenantId: "t1",
      participantId: "p1",
      dataClasses: ["participant_pii"],
      consentScopesPresent: ["care.share"],
      authorityGranted: true,
      minimumNecessaryFields: ["preferredName", "supportNotes"],
      requestedFields: ["preferredName"],
    });
    expect(r.allowed).toBe(true);
    if (!r.allowed) return;
    expect(r.sensitivity).toBe("D2_PERSONAL");
    expect(r.receipt.purpose).toBe("support_request_analysis");
  });

  it("fails closed when consent scopes are missing", () => {
    const r = evaluatePrivacyGate({
      purpose: "support_request_analysis",
      actorId: "a1",
      dataClasses: ["participant_pii"],
      consentScopesPresent: [],
      authorityGranted: true,
    });
    expect(r.allowed).toBe(false);
    if (r.allowed) return;
    expect(r.reasonCodes).toContain("CONSENT_SCOPE_MISSING");
  });

  it("denies cross-tenant requests", () => {
    const r = evaluatePrivacyGate({
      purpose: "support_request_analysis",
      actorId: "a1",
      actorTenantId: "org-a",
      tenantId: "org-b",
      dataClasses: ["operational"],
      authorityGranted: true,
      consentScopesPresent: ["care.share"],
    });
    expect(r.allowed).toBe(false);
    if (r.allowed) return;
    expect(r.reasonCodes).toContain("CROSS_TENANT_DENIED");
  });

  it("denies insufficient authority", () => {
    const r = evaluatePrivacyGate({
      purpose: "shift_support_context_minimised",
      actorId: "provider-1",
      dataClasses: ["health_sensitive"],
      authorityGranted: false,
      consentScopesPresent: ["care.share"],
    });
    expect(r.allowed).toBe(false);
    if (r.allowed) return;
    expect(r.reasonCodes).toContain("INSUFFICIENT_AUTHORITY");
  });

  it("flags minimum-necessary violations", () => {
    const r = evaluatePrivacyGate({
      purpose: "shift_support_context_minimised",
      actorId: "provider-1",
      dataClasses: ["health_sensitive"],
      authorityGranted: true,
      consentScopesPresent: ["care.share"],
      minimumNecessaryFields: ["mobilityNeeds"],
      requestedFields: ["mobilityNeeds", "fullHealthRecord", "ndisNumber"],
    });
    expect(r.allowed).toBe(false);
    if (r.allowed) return;
    expect(r.reasonCodes).toContain("MINIMUM_NECESSARY_VIOLATION");
  });
});
