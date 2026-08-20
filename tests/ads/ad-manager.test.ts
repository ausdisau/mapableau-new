import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADVERTISER_FORBIDDEN_STATUSES,
  assertAdvertiserCannotSetStatus,
  assertEditableByAdvertiser,
  AdsManagerForbiddenError,
} from "@/lib/ads/auth/advertiser-access";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { getSyntheticInternalInventory } from "@/lib/ads/fixtures/synthetic-inventory";
import { MapAbleInternalAdsAdapter } from "@/lib/ads/providers/internal/mapable-internal-adapter";
import {
  PROHIBITED_RANKING_FACTORS,
  rankCampaigns,
  type RankableCampaign,
} from "@/lib/ads/ranking/rank-campaigns";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Ad Manager flags", () => {
  it("defaults manager to disabled independently of serving", () => {
    expect(adsFlagsConfig.isManagerEnabled({})).toBe(false);
    expect(
      adsFlagsConfig.isManagerEnabled({
        MAPABLE_ADS_MANAGER_ENABLED: "true",
        MAPABLE_ADS_ENABLED: "false",
      }),
    ).toBe(true);
    expect(
      adsFlagsConfig.isManagerEnabled({
        MAPABLE_ADS_MANAGER_ENABLED: "true",
        MAPABLE_ADS_GLOBAL_KILL_SWITCH: "true",
      }),
    ).toBe(false);
  });
});

describe("advertiser status authz", () => {
  it("forbids APPROVED and ACTIVE for advertisers", () => {
    expect(ADVERTISER_FORBIDDEN_STATUSES).toContain("APPROVED");
    expect(ADVERTISER_FORBIDDEN_STATUSES).toContain("ACTIVE");
    expect(() => assertAdvertiserCannotSetStatus("APPROVED")).toThrow(
      AdsManagerForbiddenError,
    );
    expect(() => assertAdvertiserCannotSetStatus("ACTIVE")).toThrow(
      AdsManagerForbiddenError,
    );
    expect(() => assertAdvertiserCannotSetStatus("DRAFT")).not.toThrow();
    expect(() => assertAdvertiserCannotSetStatus("PAUSED")).not.toThrow();
  });

  it("only allows edit while DRAFT, REJECTED, or PAUSED", () => {
    expect(() => assertEditableByAdvertiser("DRAFT")).not.toThrow();
    expect(() => assertEditableByAdvertiser("PENDING_REVIEW")).toThrow(
      AdsManagerForbiddenError,
    );
    expect(() => assertEditableByAdvertiser("ACTIVE")).toThrow(
      AdsManagerForbiddenError,
    );
  });
});

describe("serving invariant: pending review is not eligible", () => {
  it("excludes PENDING_REVIEW campaigns from ranking fills", () => {
    const pending: RankableCampaign = {
      id: "camp_pending",
      status: "PENDING_REVIEW",
      priority: 100,
      isHouse: false,
      placementCodes: ["access.map.sponsored-card"],
      region: "national",
      geometry: { type: "NATIONAL" },
      advertiserStatus: "ACTIVE",
      creativeApproved: false,
    };
    const ranked = rankCampaigns({
      campaigns: [pending],
      placement: "access.map.sponsored-card",
      context: {
        surface: "access",
        placement: "access.map.sponsored-card",
        regionCode: "sydney",
      },
    });
    expect(ranked).toHaveLength(0);
  });

  it("internal adapter returns no fill when only pending inventory exists", async () => {
    const adapter = new MapAbleInternalAdsAdapter(
      {
        campaigns: [
          {
            id: "camp_pending",
            status: "PENDING_REVIEW",
            priority: 99,
            isHouse: false,
            placementCodes: ["access.map.sponsored-card"],
            region: "national",
            geometry: { type: "NATIONAL" },
            advertiserStatus: "DRAFT",
            creativeApproved: false,
          },
        ],
        creativesByCampaignId: {},
      },
      {
        MAPABLE_ADS_ENABLED: "true",
        MAPABLE_ADS_INTERNAL_ENABLED: "true",
      },
    );
    const decision = await adapter.requestPlacement({
      placement: "access.map.sponsored-card",
      context: {
        requestId: "req_pending",
        consentForPersonalisedAds: false,
        internal: {
          surface: "access",
          placement: "access.map.sponsored-card",
        },
      },
    });
    expect(decision.fill).toBe(false);
  });

  it("ACTIVE synthetic inventory still fills when serving flags on", async () => {
    const inventory = getSyntheticInternalInventory();
    const adapter = new MapAbleInternalAdsAdapter(inventory, {
      MAPABLE_ADS_ENABLED: "true",
      MAPABLE_ADS_INTERNAL_ENABLED: "true",
    });
    const decision = await adapter.requestPlacement({
      placement: "access.map.sponsored-card",
      context: {
        requestId: "req_active",
        consentForPersonalisedAds: false,
        internal: {
          surface: "access",
          placement: "access.map.sponsored-card",
          regionCode: "sydney",
          category: "hospitality",
          viewportBBox: [151, -34, 152, -33],
          mapCenter: { lat: -33.8688, lng: 151.2093 },
        },
      },
    });
    expect(decision.fill).toBe(true);
  });
});

describe("fairness invariants unchanged", () => {
  it("still prohibits accessibility and organic ranking factors", () => {
    expect(PROHIBITED_RANKING_FACTORS).toContain("accessibilityScore");
    expect(PROHIBITED_RANKING_FACTORS).toContain("organicSearchRank");
  });
});
