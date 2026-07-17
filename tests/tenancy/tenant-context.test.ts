import { describe, expect, it } from "vitest";

import {
  buildTenantContext,
  hasBreakGlass,
  hasExplicitTenantScope,
  isPlatformActor,
} from "@/lib/tenancy/context/tenant-context";
import {
  assertBreakGlass,
  assertTenantMatch,
  assertTenantScoped,
} from "@/lib/tenancy/context/tenant-assertions";
import { projectTenant } from "@/lib/tenancy/context/tenant-projection";

describe("tenant context (Wave 8)", () => {
  it("builds a context with the expected shape", () => {
    const ctx = buildTenantContext({
      organisationId: "org_1",
      actor: { kind: "user", userId: "u1", role: "provider_admin" },
    });
    expect(ctx.organisationId).toBe("org_1");
    expect(hasExplicitTenantScope(ctx)).toBe(true);
    expect(hasBreakGlass(ctx)).toBe(false);
    expect(isPlatformActor(ctx)).toBe(false);
  });

  it("recognises platform admin role", () => {
    const ctx = buildTenantContext({
      organisationId: null,
      actor: { kind: "user", userId: "u1", role: "mapable_admin" },
    });
    expect(isPlatformActor(ctx)).toBe(true);
    expect(hasExplicitTenantScope(ctx)).toBe(false);
  });

  it("assertTenantMatch requires an explicit tenant scope", () => {
    const ctx = buildTenantContext({
      organisationId: null,
      actor: { kind: "user", userId: "u1", role: "mapable_admin" },
    });
    expect(() => assertTenantMatch(ctx, "org_x")).toThrow(/TENANT_CONTEXT_MISSING/);
    expect(() => assertTenantScoped(ctx)).toThrow(/TENANT_CONTEXT_MISSING/);
    expect(() => assertBreakGlass(ctx)).toThrow(/BREAK_GLASS_REQUIRED/);
  });

  it("assertTenantMatch rejects a mismatched resource org", () => {
    const ctx = buildTenantContext({
      organisationId: "org_1",
      actor: { kind: "user", userId: "u1", role: "provider_admin" },
    });
    expect(() => assertTenantMatch(ctx, "org_2")).toThrow(/TENANT_MISMATCH/);
  });

  it("projectTenant returns a stable shape", () => {
    const p = projectTenant({
      id: "org_1",
      tenantKey: "acme_ndis",
      legalName: "Acme Care Pty Ltd",
      tenantType: "registered_provider",
      operatingModel: "standalone",
      tenantStatus: "active_limited",
      jurisdiction: "AU",
      dataRegion: "au",
      dataIsolationMode: "shared_schema_strict",
    });
    expect(p.tenantKey).toBe("acme_ndis");
    expect(p.tenantStatus).toBe("active_limited");
    expect(p.jurisdiction).toBe("AU");
  });
});
