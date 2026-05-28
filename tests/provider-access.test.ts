import { describe, expect, it } from "vitest";

import {
  mapOrganisationRoleToProviderRole,
  PROVIDER_CONSOLE_ORG_ROLES,
} from "@/lib/providers/provider-access";
import {
  PROVIDER_BILLING_TENANCY_NOTE_ORG,
  PROVIDER_BILLING_TENANCY_NOTE_USER,
} from "@/lib/providers/provider-cloud-context";
import { formatProviderIntegrationHealthLabel } from "@/lib/providers/provider-cloud-integrations";

describe("provider access", () => {
  it("maps organisation provider_admin to legacy ADMIN", () => {
    expect(mapOrganisationRoleToProviderRole("provider_admin")).toBe("ADMIN");
  });

  it("maps support_worker to STAFF", () => {
    expect(mapOrganisationRoleToProviderRole("support_worker")).toBe("STAFF");
  });

  it("includes provider console org roles", () => {
    expect(PROVIDER_CONSOLE_ORG_ROLES).toContain("provider_admin");
    expect(PROVIDER_CONSOLE_ORG_ROLES).toContain("support_worker");
  });
});

describe("provider cloud billing tenancy", () => {
  it("documents user- and org-scoped billing copy", () => {
    expect(PROVIDER_BILLING_TENANCY_NOTE_USER).toMatch(/personal MapAble billing/i);
    expect(PROVIDER_BILLING_TENANCY_NOTE_ORG).toMatch(/organisation billing account/i);
  });
});

describe("provider cloud integrations", () => {
  it("labels disabled integration", () => {
    expect(
      formatProviderIntegrationHealthLabel({
        status: "disabled",
        enabled: false,
        lastError: null,
        configured: false,
      })
    ).toBe("Not configured");
  });

  it("labels healthy integration", () => {
    expect(
      formatProviderIntegrationHealthLabel({
        status: "enabled",
        enabled: true,
        lastError: null,
        configured: true,
      })
    ).toBe("Operational");
  });
});
