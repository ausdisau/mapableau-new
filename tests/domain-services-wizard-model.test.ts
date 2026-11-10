import { describe, expect, it } from "vitest";

import {
  canAdvanceFrom,
  nextStep,
  previousStep,
  proposedHostname,
  validateBrand,
  validateModules,
  validateSlug,
} from "@/lib/tenancy/domain-services-wizard-model";
import { defaultBrandDraft, defaultModuleFlags } from "@/lib/tenancy/domain-services-brand";

describe("domain-services wizard model", () => {
  it("validates slug format and reserved labels", () => {
    expect(validateSlug("")).toBe("SLUG_REQUIRED");
    expect(validateSlug("!!!")).toBe("SLUG_REQUIRED");
    expect(validateSlug("a--b")).toBe("SLUG_INVALID");
    expect(validateSlug("-leading")).toBe("SLUG_INVALID");
    expect(validateSlug("admin")).toBe("SLUG_RESERVED");
    expect(validateSlug("www")).toBe("SLUG_RESERVED");
    expect(validateSlug("coveragecare")).toBe("SLUG_RESERVED");
    expect(validateSlug("acme-care")).toBe("SLUG_RESERVED");
    expect(validateSlug("sunrise-care")).toBeNull();
  });

  it("requires at least one module and a company name", () => {
    expect(validateModules(defaultModuleFlags())).toBeNull();
    expect(
      validateModules({
        landing: false,
        services: false,
        enquire: false,
        portal: false,
        contact: false,
        privacy: false,
        admin: false,
      }),
    ).toBe("MODULES_REQUIRED");
    expect(validateBrand(defaultBrandDraft())).toBe("COMPANY_REQUIRED");
    expect(validateBrand(defaultBrandDraft("Sunrise"))).toBeNull();
    expect(
      validateBrand({
        ...defaultBrandDraft("Sunrise"),
        supportEmail: "not-an-email",
      }),
    ).toBe("EMAIL_INVALID");
  });

  it("advances steps with a pure state machine", () => {
    expect(nextStep("account")).toBe("modules");
    expect(nextStep("modules")).toBe("branding");
    expect(nextStep("branding")).toBeNull();
    expect(previousStep("branding")).toBe("modules");
    expect(previousStep("account")).toBeNull();

    const input = {
      slug: "sunrise-care",
      brand: defaultBrandDraft("Sunrise Care"),
      modules: defaultModuleFlags(),
    };
    expect(canAdvanceFrom("account", input)).toBeNull();
    expect(canAdvanceFrom("modules", input)).toBeNull();
    expect(canAdvanceFrom("branding", input)).toBeNull();
    expect(canAdvanceFrom("account", { ...input, slug: "api" })).toBe(
      "SLUG_RESERVED",
    );
  });

  it("builds branding-only proposed hostnames", () => {
    expect(proposedHostname("Sunrise Care", "mapable.com.au")).toBe(
      "sunrisecare.mapable.com.au",
    );
  });
});
