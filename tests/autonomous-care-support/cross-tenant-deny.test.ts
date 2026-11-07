import { describe, expect, it } from "vitest";

import { assertParticipantTenantAccess } from "@/lib/autonomous-care-support";

describe("ACS Stage 1 — cross-tenant deny (N1/N2/N6)", () => {
  it("N2: session tenant mismatch denied before retrieval", () => {
    const result = assertParticipantTenantAccess({
      sessionTenantId: "org-2",
      resourceTenantId: "org-1",
    });
    expect(result).toEqual({ ok: false, reason: "tenant_mismatch" });
  });

  it("N6: forged client tenant claim rejected", () => {
    const result = assertParticipantTenantAccess({
      sessionTenantId: "org-1",
      resourceTenantId: "org-1",
      untrustedClientTenantId: "org-admin-forged",
    });
    expect(result).toEqual({ ok: false, reason: "forged_client_tenant" });
  });

  it("N1: missing session tenant fail-closed", () => {
    expect(
      assertParticipantTenantAccess({
        sessionTenantId: null,
        resourceTenantId: "org-1",
      }),
    ).toEqual({ ok: false, reason: "missing_tenant" });
    expect(
      assertParticipantTenantAccess({
        sessionTenantId: "   ",
        resourceTenantId: "org-1",
      }),
    ).toEqual({ ok: false, reason: "empty_tenant" });
  });

  it("allows matching session and resource tenants", () => {
    expect(
      assertParticipantTenantAccess({
        sessionTenantId: "org-1",
        resourceTenantId: "org-1",
      }),
    ).toEqual({ ok: true, tenantId: "org-1" });
  });
});
