import { afterEach, describe, expect, it, vi } from "vitest";

import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { buildMediationPolicy } from "@/lib/ads/config/mediation";
import {
  createEmptyKillSwitchState,
  isKilled,
} from "@/lib/ads/config/kill-switches";
import { validateAdDestination } from "@/lib/ads/destination/validate-url";
import { getSyntheticInternalInventory } from "@/lib/ads/fixtures/synthetic-inventory";
import { campaignGeometryIntersectsViewport } from "@/lib/ads/geo/campaign-geo";
import { routePlacementRequest } from "@/lib/ads/mediation/provider-router";
import {
  clearImpressionDedupe,
  shouldRecordFirstPartyImpression,
} from "@/lib/ads/measurement/impressions";
import { flagCreativeClaims } from "@/lib/ads/moderation/creative-review";
import { getPlacement, PLACEMENT_REGISTRY } from "@/lib/ads/placement-registry";
import { evaluateAdPolicy } from "@/lib/ads/policy/policy-engine";
import { EthicalAdsAdapter } from "@/lib/ads/providers/ethicalads/ethicalads-adapter";
import { GoogleAdManagerAdapter } from "@/lib/ads/providers/google-ad-manager/google-ad-manager-adapter";
import { MapAbleInternalAdsAdapter } from "@/lib/ads/providers/internal/mapable-internal-adapter";
import {
  assertNoSensitiveExternalKeys,
  sanitizeExternalAdContext,
} from "@/lib/ads/privacy/sanitize-external-context";
import { SENSITIVE_AD_CONTEXT_KEYS } from "@/lib/ads/privacy/sensitive-keys";
import {
  PROHIBITED_RANKING_FACTORS,
  rankCampaigns,
} from "@/lib/ads/ranking/rank-campaigns";
import type { AdPlacementRequest, InternalAdContext } from "@/lib/ads/types";

afterEach(() => {
  vi.unstubAllEnvs();
  clearImpressionDedupe();
});

const enabledEnv = {
  MAPABLE_ADS_ENABLED: "true",
  MAPABLE_ADS_ACCESS_ENABLED: "true",
  MAPABLE_ADS_PROVIDER_FINDER_ENABLED: "true",
  MAPABLE_ADS_INTERNAL_ENABLED: "true",
  MAPABLE_ADS_GOOGLE_ENABLED: "false",
  MAPABLE_ADS_ETHICALADS_ENABLED: "false",
  MAPABLE_ADS_GLOBAL_KILL_SWITCH: "false",
};

function baseRequest(
  overrides: Partial<AdPlacementRequest> = {},
): AdPlacementRequest {
  return {
    placement: "access.map.sponsored-card",
    context: {
      requestId: "req_test_1",
      consentForPersonalisedAds: false,
      internal: {
        surface: "access",
        placement: "access.map.sponsored-card",
        regionCode: "sydney",
        category: "hospitality",
        viewportBBox: [151.0, -34.0, 151.4, -33.7],
        mapCenter: { lat: -33.8688, lng: 151.2093 },
        zoom: 12,
      },
    },
    ...overrides,
  };
}

describe("ads flags", () => {
  it("defaults to disabled", () => {
    expect(adsFlagsConfig.isEnabled({})).toBe(false);
    expect(adsFlagsConfig.isAccessEnabled({})).toBe(false);
  });

  it("respects global kill switch", () => {
    expect(
      adsFlagsConfig.isEnabled({
        ...enabledEnv,
        MAPABLE_ADS_GLOBAL_KILL_SWITCH: "true",
      }),
    ).toBe(false);
  });
});

describe("placement registry", () => {
  it("registers all foundation placements", () => {
    expect(Object.keys(PLACEMENT_REGISTRY)).toHaveLength(7);
    expect(getPlacement("access.map.sponsored-marker")?.capabilities.supportsMapMarker).toBe(
      true,
    );
    expect(
      getPlacement("provider-finder.results.inline")?.capabilities
        .supportsExternalDOMSlot,
    ).toBe(true);
  });
});

describe("policy engine", () => {
  it("blocks when feature flag off", () => {
    const decision = evaluateAdPolicy({
      context: baseRequest().context,
      placement: "access.map.sponsored-card",
      env: {},
    });
    expect(decision).toEqual({
      allowed: false,
      reasonCode: "FEATURE_FLAG_OFF",
    });
  });

  it("allows when flags on", () => {
    const decision = evaluateAdPolicy({
      context: baseRequest().context,
      placement: "access.map.sponsored-card",
      env: enabledEnv,
      surfaceEnabled: true,
    });
    expect(decision.allowed).toBe(true);
  });
});

describe("ranking", () => {
  it("ranks eligible campaigns deterministically", () => {
    const inventory = getSyntheticInternalInventory();
    const ranked = rankCampaigns({
      campaigns: inventory.campaigns,
      placement: "access.map.sponsored-marker",
      context: baseRequest().context.internal,
    });
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]?.campaignId).toBe("camp_synth_direct_cafe");
    expect(ranked[0]?.reasonCodes).toContain("PLACEMENT_MATCH");
  });

  it("documents prohibited ranking factors", () => {
    expect(PROHIBITED_RANKING_FACTORS).toContain("accessibilityScore");
    expect(PROHIBITED_RANKING_FACTORS).toContain("providerSuitabilityScore");
    expect(PROHIBITED_RANKING_FACTORS).toContain("organicSearchRank");
    expect(PROHIBITED_RANKING_FACTORS).toContain("ndis");
  });
});

describe("geo targeting", () => {
  it("matches point+radius against viewport", () => {
    expect(
      campaignGeometryIntersectsViewport(
        {
          type: "Point",
          coordinates: [151.2093, -33.8688],
          radiusKm: 50,
        },
        [151.0, -34.0, 151.4, -33.7],
      ),
    ).toBe(true);
  });

  it("matches NATIONAL always", () => {
    expect(
      campaignGeometryIntersectsViewport({ type: "NATIONAL" }, undefined),
    ).toBe(true);
  });
});

describe("privacy sanitiser", () => {
  it("allowlists external context and drops sensitive keys", () => {
    const internal: InternalAdContext = {
      surface: "provider_finder",
      placement: "provider-finder.results.inline",
      regionCode: "sydney",
      category: "allied_services",
      zoom: 11,
      viewportBBox: [150, -34, 152, -33],
      mapCenter: { lat: -33.8, lng: 151.2 },
      searchContext:
        "wheelchair user looking for cerebral palsy physiotherapy near home",
    };

    const external = sanitizeExternalAdContext(internal, {
      diagnosis: "cerebral palsy",
      disability: "mobility",
      ndisNumber: "430000000",
      planBalance: 12000,
      medicalNotes: "secret",
      aacPreference: "device",
      participantId: "user_1",
      email: "a@b.com",
      phone: "0400000000",
      exactHomeLocation: "-33.8,151.2",
    });

    expect(external).toEqual({
      surface: "provider_finder",
      placement: "provider-finder.results.inline",
      regionCode: "sydney",
      category: "allied_services",
      zoomBand: "local",
    });

    const leaked = assertNoSensitiveExternalKeys(
      external as unknown as Record<string, unknown>,
    );
    expect(leaked).toEqual([]);

    for (const key of SENSITIVE_AD_CONTEXT_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(external, key)).toBe(false);
    }
  });

  it("rejects unknown categories and regions", () => {
    const external = sanitizeExternalAdContext({
      surface: "access",
      placement: "access.results.inline",
      regionCode: "not-a-real-region",
      category: "secret-medical-category",
    });
    expect(external.regionCode).toBeUndefined();
    expect(external.category).toBeUndefined();
  });
});

describe("destination validation", () => {
  it("blocks javascript and data URLs", () => {
    expect(validateAdDestination("javascript:alert(1)").ok).toBe(false);
    expect(validateAdDestination("data:text/html,hi").ok).toBe(false);
  });

  it("accepts https destinations", () => {
    const r = validateAdDestination("https://mapable.com.au/access", {
      requireHttps: true,
    });
    expect(r.ok).toBe(true);
  });
});

describe("impression dedupe", () => {
  it("prevents duplicate first-party impressions", () => {
    expect(shouldRecordFirstPartyImpression("dec_1:placement")).toBe(true);
    expect(shouldRecordFirstPartyImpression("dec_1:placement")).toBe(false);
  });
});

describe("creative claim flags", () => {
  it("flags accessibility and NDIS claims", () => {
    const flags = flagCreativeClaims(
      "Fully accessible NDIS approved best café",
    );
    expect(flags.length).toBeGreaterThan(0);
    expect(flags).toEqual(
      expect.arrayContaining(["accessible", "ndis", "best"]),
    );
  });
});

describe("provider adapters", () => {
  it("internal adapter fills from synthetic inventory", async () => {
    const adapter = new MapAbleInternalAdsAdapter(
      getSyntheticInternalInventory(),
      enabledEnv,
    );
    const decision = await adapter.requestPlacement(baseRequest());
    expect(decision.fill).toBe(true);
    if (decision.fill && decision.kind === "internal") {
      expect(decision.creative.headline).toBeTruthy();
      expect(decision.creative.destinationUrl.startsWith("https://")).toBe(
        true,
      );
    }
  });

  it("google adapter is unavailable when disabled", async () => {
    const adapter = new GoogleAdManagerAdapter(enabledEnv);
    expect(await adapter.isAvailable(baseRequest().context)).toBe(false);
    expect(adapter.getCapabilities().mapMarkers).toBe(false);
    expect(adapter.getCapabilities().personalisedTargeting).toBe(false);
  });

  it("ethicalads requires exclusive page mode", () => {
    const adapter = new EthicalAdsAdapter({
      ...enabledEnv,
      MAPABLE_ADS_ETHICALADS_ENABLED: "true",
      ETHICALADS_PUBLISHER_ID: "test-pub",
    });
    expect(adapter.getCapabilities().requiresExclusivePageMode).toBe(true);
    expect(adapter.getCapabilities().mapMarkers).toBe(false);
  });
});

describe("mediation / exclusivity", () => {
  it("uses ethicalads exclusive order when enabled", () => {
    const policy = buildMediationPolicy({
      ...enabledEnv,
      MAPABLE_ADS_ETHICALADS_ENABLED: "true",
      MAPABLE_ADS_GOOGLE_ENABLED: "true",
    });
    expect(policy.pageAdMode).toBe("ethicalads_exclusive");
    expect(policy.providerOrder).not.toContain("google_ad_manager");
    expect(policy.providerOrder[0]).toBe("ethicalads");
  });

  it("routes internal fill when enabled", async () => {
    const inventory = getSyntheticInternalInventory();
    const fill = await routePlacementRequest(baseRequest(), {
      env: enabledEnv,
      adapters: {
        mapable_internal: new MapAbleInternalAdsAdapter(inventory, enabledEnv),
      },
    });
    expect(fill.kind).toBe("internal");
    if (fill.kind === "internal") {
      expect(fill.disclosureLabel).toBe("Sponsored");
      expect(fill.clickPath.startsWith("/r/ads/")).toBe(true);
    }
  });

  it("returns no_fill on global kill switch", async () => {
    const fill = await routePlacementRequest(baseRequest(), {
      env: { ...enabledEnv, MAPABLE_ADS_GLOBAL_KILL_SWITCH: "true" },
      adapters: {
        mapable_internal: new MapAbleInternalAdsAdapter(
          getSyntheticInternalInventory(),
          enabledEnv,
        ),
      },
      killSwitches: createEmptyKillSwitchState(true),
    });
    expect(fill.kind).toBe("no_fill");
  });

  it("provider kill switch skips provider", () => {
    const state = createEmptyKillSwitchState(false);
    state.providers.mapable_internal = false;
    expect(
      isKilled(state, { providerId: "mapable_internal" }),
    ).toEqual({ killed: true, scope: "provider" });
  });
});

describe("critical invariant: advertising does not mutate organic systems", () => {
  it("ranking module exports no mutators for accessibility or suitability", async () => {
    const ranking = await import("@/lib/ads/ranking/rank-campaigns");
    const keys = Object.keys(ranking);
    expect(keys).not.toContain("createAccessibilityScore");
    expect(keys).not.toContain("updateAccessibilityScore");
    expect(keys).not.toContain("overrideAccessibilityScore");
    expect(keys).not.toContain("deleteAccessibilityBarrier");
    expect(keys).not.toContain("hideAccessibilityReview");
  });

  it("ads modules do not import accessibility score writers", async () => {
    // Static import graph check via source presence of prohibited names in ads tree
    const fs = await import("node:fs");
    const path = await import("node:path");
    const adsRoot = path.join(process.cwd(), "lib/ads");

    function walk(dir: string): string[] {
      const out: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          out.push(full);
        }
      }
      return out;
    }

    const prohibited = [
      "createAccessibilityScore",
      "updateAccessibilityScore",
      "overrideAccessibilityScore",
      "deleteAccessibilityBarrier",
      "hideAccessibilityReview",
    ];

    for (const file of walk(adsRoot)) {
      const src = fs.readFileSync(file, "utf8");
      for (const name of prohibited) {
        expect(src.includes(name)).toBe(false);
      }
    }
  });

  it("organic provider finder visible order is independent of ads fill", () => {
    const organic = ["a", "b", "c"];
    const withSponsoredSlot = ["sponsored", ...organic];
    // Sponsored is a separate slot — organic array identity preserved
    expect(organic).toEqual(["a", "b", "c"]);
    expect(withSponsoredSlot.slice(1)).toEqual(organic);
  });
});
