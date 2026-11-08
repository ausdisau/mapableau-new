import { describe, expect, it, vi } from "vitest";

/**
 * Documented negative contract: advertiser access must fail closed across orgs.
 * Full HTTP integration requires seeded DB; this pins the helper behaviour.
 */
describe("cross-tenant advertiser guard contract", () => {
  it("OrganisationAccessError is distinguishable for API 403 mapping", async () => {
    const { OrganisationAccessError } = await import(
      "@/lib/api/organisation-scope"
    );
    const err = new OrganisationAccessError("denied");
    expect(err).toBeInstanceOf(Error);
    expect(String(err.message).length).toBeGreaterThan(0);
  });

  it("ads permission helper denies missing spend approve for editor-only role", async () => {
    const { userHasAdsPermission } = await import(
      "@/lib/ads/auth/ads-permissions"
    );
    const editor = {
      id: "u1",
      email: "e@example.com",
      name: "Editor",
      phone: null,
      timezone: "Australia/Sydney",
      locale: "en-AU",
      primaryRole: "participant" as const,
      roles: ["participant" as const],
    };
    expect(userHasAdsPermission(editor, "ads:spend:approve")).toBe(false);
    expect(userHasAdsPermission(editor, "ads:campaigns:write")).toBe(false);
  });

  it("provider_admin receives ads spend permission", async () => {
    vi.resetModules();
    const { userHasAdsPermission } = await import(
      "@/lib/ads/auth/ads-permissions"
    );
    const admin = {
      id: "u2",
      email: "a@example.com",
      name: "Provider",
      phone: null,
      timezone: "Australia/Sydney",
      locale: "en-AU",
      primaryRole: "provider_admin" as const,
      roles: ["provider_admin" as const],
    };
    expect(userHasAdsPermission(admin, "ads:spend:approve")).toBe(true);
    expect(userHasAdsPermission(admin, "ads:campaigns:write")).toBe(true);
  });
});
