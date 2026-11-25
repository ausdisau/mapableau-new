import { afterEach, describe, expect, it } from "vitest";

import { isDomainServicesSelfServeEnabled } from "@/lib/config/domain-services";
import {
  defaultBrandDraft,
  defaultModuleFlags,
} from "@/lib/tenancy/domain-services-brand";
import {
  getDraftBySlug,
  isSlugAvailable,
  resetDomainServicesDraftsForTests,
  upsertDraftTenant,
} from "@/lib/tenancy/domain-services-registry";
import {
  denyClientTenantClaim,
  resolveTenantBySlug,
} from "@/lib/tenancy/tenant-registry";

describe("domain-services registry + tenancy gates", () => {
  afterEach(() => {
    resetDomainServicesDraftsForTests();
    delete process.env.MAPABLE_DOMAIN_SERVICES_SELF_SERVE_ENABLED;
  });

  it("defaults self-serve flag OFF (fail-closed)", () => {
    delete process.env.MAPABLE_DOMAIN_SERVICES_SELF_SERVE_ENABLED;
    expect(isDomainServicesSelfServeEnabled()).toBe(false);
    process.env.MAPABLE_DOMAIN_SERVICES_SELF_SERVE_ENABLED = "true";
    expect(isDomainServicesSelfServeEnabled()).toBe(true);
  });

  it("blocks reserved and colliding slugs", () => {
    expect(isSlugAvailable("admin").available).toBe(false);
    expect(isSlugAvailable("admin").reason).toBe("SLUG_RESERVED");
    expect(isSlugAvailable("coveragecare").available).toBe(false);

    upsertDraftTenant({
      organisationId: "org_a",
      ownerUserId: "user_a",
      slug: "sunrise-care",
      brand: defaultBrandDraft("Sunrise Care"),
      modules: defaultModuleFlags(),
    });

    expect(isSlugAvailable("sunrise-care").available).toBe(false);
    expect(isSlugAvailable("sunrise-care").reason).toBe("SLUG_TAKEN");
    expect(
      isSlugAvailable("sunrise-care", { organisationId: "org_a" }).available,
    ).toBe(true);
  });

  it("resolves drafts via resolveTenantBySlug without leaking across orgs", () => {
    upsertDraftTenant({
      organisationId: "org_sunrise",
      ownerUserId: "user_1",
      slug: "sunrise-care",
      brand: defaultBrandDraft("Sunrise Care"),
      modules: defaultModuleFlags(),
    });
    upsertDraftTenant({
      organisationId: "org_harbor",
      ownerUserId: "user_2",
      slug: "harbor-supports",
      brand: defaultBrandDraft("Harbor Supports"),
      modules: defaultModuleFlags(),
    });

    const sunrise = resolveTenantBySlug("sunrise-care");
    const harbor = resolveTenantBySlug("harbor-supports");
    expect(sunrise?.organisationId).toBe("org_sunrise");
    expect(harbor?.organisationId).toBe("org_harbor");
    expect(sunrise?.source).toBe("domain_services_draft");
    expect(getDraftBySlug("sunrise-care")?.ownerUserId).toBe("user_1");
    expect(getDraftBySlug("harbor-supports")?.domainActivation).toBe(
      "NOT_CONFIGURED",
    );

    expect(() =>
      upsertDraftTenant({
        organisationId: "org_harbor",
        ownerUserId: "user_2",
        slug: "sunrise-care",
        brand: defaultBrandDraft("Harbor Supports"),
        modules: defaultModuleFlags(),
      }),
    ).toThrow("SLUG_TAKEN");
  });

  it("never authorises from Host or client tenant headers", () => {
    expect(() =>
      denyClientTenantClaim({
        host: "sunrise-care.mapable.com.au",
        headerTenantId: "tenant_ds_fake",
        organisationId: "org_sunrise",
      }),
    ).toThrow("CLIENT_TENANT_CLAIM_REJECTED");
  });

  it("keeps static Coverage Care resolution intact", () => {
    const cc = resolveTenantBySlug("coveragecare");
    expect(cc?.source).toBe("static");
    expect(cc?.slug).toBe("coveragecare");
    expect(resolveTenantBySlug("admin")).toBeNull();
  });
});
