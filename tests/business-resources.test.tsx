/**
 * @vitest-environment jsdom
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { BusinessResourceFilters } from "@/components/resources/business/BusinessResourceFilters";
import {
  businessResources,
  filterBusinessResources,
  getBusinessResourceBySlug,
  BUSINESS_RESOURCES_DISCLAIMER,
} from "@/lib/resources/business-resources-data";

describe("business access resources data", () => {
  it("includes the required catalogue and routes", () => {
    expect(businessResources.length).toBeGreaterThanOrEqual(13);
    expect(getBusinessResourceBySlug("access-barrier-self-check")?.featured).toBe(
      true,
    );
    expect(
      getBusinessResourceBySlug("accessibility-statement-generator")?.href,
    ).toBe("/resources/business/accessibility-statement-generator");
    for (const resource of businessResources) {
      expect(resource.href).toBe(`/resources/business/${resource.slug}`);
      expect(resource.barrierTypes.length).toBeGreaterThan(0);
      expect(resource.audience.length).toBeGreaterThan(0);
    }
  });

  it("filters by businesses and venues audiences", () => {
    expect(
      filterBusinessResources({ audience: "businesses" }).length,
    ).toBeGreaterThan(0);
    expect(
      filterBusinessResources({ audience: "venues" }).length,
    ).toBeGreaterThan(0);
    expect(
      filterBusinessResources({ query: "sensory" }).some(
        (item) => item.slug === "sensory-friendly-business",
      ),
    ).toBe(true);
  });

  it("keeps advisory disclaimer wording", () => {
    expect(BUSINESS_RESOURCES_DISCLAIMER).toContain(
      "not legal, building, safety, medical or NDIS advice",
    );
  });
});

describe("business resource filters", () => {
  it("announces result counts and supports Businesses/Venues chips", () => {
    render(
      <BusinessResourceFilters
        filters={{
          query: "",
          audience: "businesses",
          format: null,
          barrier: null,
        }}
        audiences={["businesses", "venues", "providers", "employers", "event-organisers"]}
        formats={["self-check", "guide"]}
        barriers={["physical", "digital"]}
        resultCount={4}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByText(/Showing 4 resources/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Businesses" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(screen.getByRole("button", { name: "Venues" })).toBeTruthy();
  });
});

describe("business resource files", () => {
  it("ships hub, dynamic pages, data and components", () => {
    const root = process.cwd();
    const required = [
      "app/(marketing)/resources/business/page.tsx",
      "app/(marketing)/resources/business/[slug]/page.tsx",
      "src/data/businessResources.ts",
      "lib/resources/business-resources-data.ts",
      "types/business-resource.ts",
      "components/resources/business/BusinessResourcesHero.tsx",
      "components/resources/business/BusinessResourceCard.tsx",
      "components/resources/business/BusinessBarrierCategoryGrid.tsx",
      "components/resources/business/BusinessAccessSelfCheckCTA.tsx",
      "components/resources/business/BusinessAccessStatementCTA.tsx",
      "components/resources/business/BusinessResourceExternalLinks.tsx",
      "components/resources/business/BusinessDisclaimerPanel.tsx",
      "components/resources/business/BusinessAccessSelfCheckForm.tsx",
      "components/resources/ResourcesAudienceFilter.tsx",
    ];
    for (const relative of required) {
      expect(existsSync(join(root, relative))).toBe(true);
    }
  });
});
