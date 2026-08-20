/**
 * MapAble Ads canonical types.
 * Provider-specific fields must stay under lib/ads/providers/*.
 */

export type AdProviderId =
  | "mapable_internal"
  | "google_ad_manager"
  | "ethicalads";

export type AdSurface = "access" | "provider_finder";

export type PlacementCode =
  | "access.map.sponsored-marker"
  | "access.map.sponsored-card"
  | "access.map.bottom-sheet"
  | "access.results.inline"
  | "provider-finder.map.sponsored-card"
  | "provider-finder.results.inline"
  | "provider-finder.sidebar";

export type PlacementCapability = {
  supportsInternalCreative: boolean;
  supportsExternalDOMSlot: boolean;
  supportsMapMarker: boolean;
  supportsImage: boolean;
  supportsText: boolean;
  maxAds: number;
};

export type AdProviderCapabilities = {
  mapMarkers: boolean;
  domSlots: boolean;
  contextualTargeting: boolean;
  coarseGeoTargeting: boolean;
  personalisedTargeting: boolean;
  requiresConsent: boolean;
  requiresExclusivePageMode: boolean;
};

export type ZoomBand = "national" | "region" | "local" | "street";

/** Precise context — MapAble internal use only. Never send to external networks. */
export type InternalAdContext = {
  surface: AdSurface;
  placement: PlacementCode;
  viewportBBox?: [number, number, number, number]; // west, south, east, north
  mapCenter?: { lat: number; lng: number };
  zoom?: number;
  zoomBand?: ZoomBand;
  category?: string;
  regionCode?: string;
  searchContext?: string;
  deviceLayoutClass?: "mobile" | "tablet" | "desktop";
  layout?: "map" | "list" | "split";
};

/** Coarse allowlisted context for external providers. */
export type ExternalAdContext = {
  surface: AdSurface | "provider_finder";
  placement: PlacementCode;
  regionCode?: string;
  category?: string;
  zoomBand?: ZoomBand;
};

export type AdMediationPolicy = {
  providerOrder: AdProviderId[];
  allowHouseFallback: boolean;
  allowNoFill: boolean;
  pageAdMode?: "open" | "ethicalads_exclusive";
};

export type AdPolicyReasonCode =
  | "SENSITIVE_CONTEXT"
  | "PROVIDER_DISABLED"
  | "CAMPAIGN_INACTIVE"
  | "CREATIVE_UNAPPROVED"
  | "PLACEMENT_UNSUPPORTED"
  | "EXCLUSIVE_PROVIDER_CONFLICT"
  | "MISSING_REQUIRED_CONSENT"
  | "INVALID_DESTINATION"
  | "UNSAFE_TARGETING_CONTEXT"
  | "GLOBAL_KILL_SWITCH"
  | "SURFACE_DISABLED"
  | "PLACEMENT_DISABLED"
  | "ADVERTISER_DISABLED"
  | "FEATURE_FLAG_OFF"
  | "NO_ELIGIBLE_CAMPAIGN"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "NO_FILL";

export type AdPolicyDecision =
  | { allowed: true }
  | { allowed: false; reasonCode: AdPolicyReasonCode };

export type AdRankingReasonCode =
  | "PLACEMENT_MATCH"
  | "REGION_MATCH"
  | "CATEGORY_MATCH"
  | "CAMPAIGN_ACTIVE"
  | "GEO_MATCH"
  | "PRIORITY"
  | "HOUSE_PROMOTION"
  | "SCHEDULE_MATCH";

export type AdEligibilityResult = {
  campaignId: string;
  eligible: boolean;
  reasonCodes: AdRankingReasonCode[];
  priority: number;
};

export type AdCreativePayload = {
  id: string;
  campaignId: string;
  format: string;
  headline: string;
  body: string;
  imageUrl?: string | null;
  altText?: string | null;
  destinationUrl: string;
  latitude?: number | null;
  longitude?: number | null;
  businessName?: string | null;
};

export type AdPlacementFill =
  | {
      kind: "internal";
      provider: "mapable_internal";
      decisionId: string;
      campaignId: string;
      creative: AdCreativePayload;
      disclosureLabel: "Sponsored";
      clickPath: string;
    }
  | {
      kind: "external_dom";
      provider: "google_ad_manager" | "ethicalads";
      decisionId: string;
      slotKey: string;
      disclosureLabel: "Sponsored";
      externalContext: ExternalAdContext;
    }
  | {
      kind: "no_fill";
      reasonCode: AdPolicyReasonCode;
    };

export type AdRequestContext = {
  internal: InternalAdContext;
  consentForPersonalisedAds: boolean;
  anonymousSessionRef?: string;
  requestId: string;
  now?: Date;
};

export type AdPlacementRequest = {
  context: AdRequestContext;
  placement: PlacementCode;
  maxItems?: number;
};

export type AdProviderDecision =
  | {
      fill: true;
      kind: "internal";
      campaignId: string;
      creative: AdCreativePayload;
      reasonCodes: AdRankingReasonCode[];
    }
  | {
      fill: true;
      kind: "external_dom";
      slotKey: string;
    }
  | {
      fill: false;
      reasonCode: AdPolicyReasonCode;
    };

export type AdImpressionEvent = {
  decisionId: string;
  placementCode: PlacementCode;
  provider: AdProviderId;
  campaignId?: string;
  anonymousSessionRef?: string;
};

export type AdClickEvent = {
  impressionId: string;
  provider: AdProviderId;
  campaignId?: string;
};
