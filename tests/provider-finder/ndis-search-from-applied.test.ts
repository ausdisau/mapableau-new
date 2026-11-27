import { describe, expect, it } from "vitest";

import {
  buildNdisSearchParamsFromApplied,
  parseLocationForNdisSearch,
} from "@/lib/provider/finder/ndis-search-from-applied";
import {
  PROVIDER_SERVICE_CATALOG,
  resolveProviderServiceCatalog,
} from "@/lib/provider/finder/search-service-catalog";
import type { SearchInterpretation } from "@/types/search";

function interpretation(
  overrides: Partial<SearchInterpretation> = {},
): SearchInterpretation {
  return {
    sourceQuery: "morning daily activities around Penrith",
    parsed: true,
    configured: true,
    filters: {
      q: "morning daily activities around Penrith",
      location: "Penrith 2750",
      access: "text communication",
      service: "morning daily activities",
      provider: "",
    },
    serviceCategorySlug: "daily-life",
    serviceCategoryId: null,
    accessNeedIds: ["text-communication"],
    accessNeeds: { ids: ["text-communication"], confidence: 0.8, source: "keyword" },
    confidence: 0.72,
    engineId: "test",
    ...overrides,
  };
}

describe("buildNdisSearchParamsFromApplied", () => {
  it("maps Penrith daily activities onto independent suburb, postcode, and catalog fields", () => {
    expect(resolveProviderServiceCatalog("morning daily activities")).toBe(
      "daily_life",
    );
    expect(resolveProviderServiceCatalog("daily activities")).toBe("daily_life");

    const params = buildNdisSearchParamsFromApplied(
      {
        query: "morning daily activities around Penrith",
        location: "Penrith 2750",
        providerName: "",
        serviceQuery: "morning daily activities",
        accessQuery: "text communication",
        supportType: "personal-care",
        accessNeedIds: ["text-communication"],
      },
      interpretation(),
    );

    expect(params.q).toBeUndefined();
    expect(params.suburb).toBe("Penrith");
    expect(params.postcode).toBe("2750");
    expect(params.service).toBe("morning daily activities");
    expect(params.registrationGroups).toEqual(
      PROVIDER_SERVICE_CATALOG.daily_life.registrationGroups,
    );
    expect(params.serviceLabels).toEqual(
      PROVIDER_SERVICE_CATALOG.daily_life.serviceLabels,
    );
  });

  it("uses provider name only for q when a name is present", () => {
    const params = buildNdisSearchParamsFromApplied(
      {
        query: "Harbour Support around Penrith",
        location: "Penrith NSW 2750",
        providerName: "Harbour Support Co.",
        serviceQuery: "support coordination",
        accessQuery: "",
        supportType: null,
        accessNeedIds: [],
      },
      interpretation({
        filters: {
          q: "Harbour Support around Penrith",
          location: "Penrith NSW 2750",
          access: "",
          service: "support coordination",
          provider: "Harbour Support Co.",
        },
        serviceCategorySlug: "support-coordination",
      }),
    );

    expect(params.q).toBe("Harbour Support Co.");
    expect(params.q).not.toMatch(/penrith/i);
    expect(params.state).toBe("NSW");
    expect(params.postcode).toBe("2750");
    expect(params.suburb).toBe("Penrith");
  });

  it("parses suburb independently of state and postcode", () => {
    expect(parseLocationForNdisSearch("Penrith 2750")).toEqual({
      state: undefined,
      postcode: "2750",
      suburbQuery: "Penrith",
    });
  });
});
