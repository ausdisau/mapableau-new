/**
 * Synthetic MapAble Ads fixtures for foundation tests and local demos.
 * Never seed real provider or participant data.
 */

import type { InternalInventory } from "@/lib/ads/providers/internal/mapable-internal-adapter";
import type { AdCreativePayload } from "@/lib/ads/types";
import type { RankableCampaign } from "@/lib/ads/ranking/rank-campaigns";

export const SYNTHETIC_HOUSE_CAMPAIGN_ID = "camp_synth_house_academy";
export const SYNTHETIC_DIRECT_CAMPAIGN_ID = "camp_synth_direct_cafe";
export const SYNTHETIC_CREATIVE_HOUSE_ID = "cre_synth_house_academy";
export const SYNTHETIC_CREATIVE_DIRECT_ID = "cre_synth_direct_cafe";

const houseCreative: AdCreativePayload = {
  id: SYNTHETIC_CREATIVE_HOUSE_ID,
  campaignId: SYNTHETIC_HOUSE_CAMPAIGN_ID,
  format: "text_card",
  headline: "MapAble Academy",
  body: "Learn accessibility practices with MapAble Guides.",
  destinationUrl: "https://mapable.com.au/academy",
  businessName: "MapAble Academy",
  altText: "MapAble Academy house promotion",
};

const directCreative: AdCreativePayload = {
  id: SYNTHETIC_CREATIVE_DIRECT_ID,
  campaignId: SYNTHETIC_DIRECT_CAMPAIGN_ID,
  format: "map_marker",
  headline: "Example Inclusive Café",
  body: "Accessibility information available on MapAble Access.",
  destinationUrl: "https://mapable.com.au/access",
  businessName: "Example Inclusive Café",
  latitude: -33.8688,
  longitude: 151.2093,
  altText: "Example Inclusive Café sponsored listing",
};

const campaigns: RankableCampaign[] = [
  {
    id: SYNTHETIC_HOUSE_CAMPAIGN_ID,
    status: "ACTIVE",
    priority: 10,
    isHouse: true,
    bidModel: "HOUSE",
    maxBidMicros: null,
    placementCodes: [
      "access.map.sponsored-card",
      "access.results.inline",
      "access.map.bottom-sheet",
      "provider-finder.results.inline",
      "provider-finder.sidebar",
      "provider-finder.map.sponsored-card",
    ],
    region: "national",
    category: "education",
    geometry: { type: "NATIONAL" },
    advertiserStatus: "ACTIVE",
    creativeApproved: true,
    advertiserId: "adv_synth_house",
    walletStatus: "ACTIVE",
    walletAvailableMicros: 0n,
    todaySpendMicros: 0n,
    lifetimeSpendMicros: 0n,
    lifetimeImpressions: 0,
    lifetimeClicks: 0,
  },
  {
    id: SYNTHETIC_DIRECT_CAMPAIGN_ID,
    status: "ACTIVE",
    priority: 50,
    isHouse: false,
    bidModel: "CPM",
    maxBidMicros: 22_000_000n,
    dailyBudgetMicros: 500_000_000n,
    lifetimeBudgetMicros: 5_000_000_000n,
    placementCodes: [
      "access.map.sponsored-marker",
      "access.map.sponsored-card",
      "access.results.inline",
    ],
    region: "sydney",
    category: "hospitality",
    geometry: {
      type: "Point",
      coordinates: [151.2093, -33.8688],
      radiusKm: 50,
    },
    advertiserStatus: "ACTIVE",
    creativeApproved: true,
    advertiserId: "adv_synth_direct",
    walletStatus: "ACTIVE",
    walletAvailableMicros: 1_000_000_000n,
    todaySpendMicros: 0n,
    lifetimeSpendMicros: 0n,
    lifetimeImpressions: 100,
    lifetimeClicks: 2,
  },
];

export function getSyntheticInternalInventory(): InternalInventory {
  return {
    campaigns,
    creativesByCampaignId: {
      [SYNTHETIC_HOUSE_CAMPAIGN_ID]: houseCreative,
      [SYNTHETIC_DIRECT_CAMPAIGN_ID]: directCreative,
    },
  };
}
