import { describe, expect, it } from "vitest";

import { evaluatePlatformAdminRead } from "@/lib/tenancy/access/platform-admin-policy";
import { buildTenantContext } from "@/lib/tenancy/context/tenant-context";

const adminUser = { primaryRole: "mapable_admin" as const };
const providerUser = { primaryRole: "provider_admin" as const };

function ctx(orgId: string | null, opts: { breakGlassSessionId?: string } = {}) {
  return buildTenantContext({
    organisationId: orgId,
    actor: { kind: "user", userId: "u1", role: adminUser.primaryRole },
    breakGlassSessionId: opts.breakGlassSessionId,
  });
}

describe("platform admin ambient bypass is denied (Wave 8)", () => {
  it("denies ambient admin without explicit scope or break-glass", () => {
    const decision = evaluatePlatformAdminRead(adminUser, ctx(null));
    expect(decision.allowed).toBe(false);
    expect(decision.denialCode).toBe("AMBIENT_ADMIN_DENIED");
  });

  it("allows admin with explicit tenant scope", () => {
    const decision = evaluatePlatformAdminRead(adminUser, ctx("org_1"));
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe("explicit_tenant_scope");
  });

  it("allows admin with active break-glass session id on context", () => {
    const decision = evaluatePlatformAdminRead(
      adminUser,
      ctx(null, { breakGlassSessionId: "bg_1" })
    );
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe("break_glass_in_force");
  });

  it("denies non-admin regardless of scope", () => {
    const c = buildTenantContext({
      organisationId: "org_1",
      actor: { kind: "user", userId: "u1", role: "provider_admin" },
    });
    const decision = evaluatePlatformAdminRead(providerUser, c);
    expect(decision.allowed).toBe(false);
    expect(decision.denialCode).toBe("NOT_ADMIN");
  });
});
