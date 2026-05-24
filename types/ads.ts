import { z } from "zod";

/** Supported ad placement types across MapAble surfaces. */
export const AD_TYPES = [
  "sponsored_provider_pin",
  "sponsored_provider_card",
  "local_campaign_banner",
  "sponsored_event",
  "sponsored_marketplace_listing",
  "sponsored_service_zone",
] as const;

export type AdType = (typeof AD_TYPES)[number];

export const AD_CAMPAIGN_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "active",
  "paused",
  "rejected",
  "suspended",
  "ended",
] as const;

export type AdCampaignStatus = (typeof AD_CAMPAIGN_STATUSES)[number];

export const AD_REVIEW_DECISIONS = [
  "pending",
  "approved",
  "rejected",
  "changes_requested",
] as const;

export type AdReviewDecision = (typeof AD_REVIEW_DECISIONS)[number];

export const AD_EVENT_TYPES = [
  "impression",
  "click",
  "map_pin_opened",
  "cta_clicked",
  "booking_started",
  "booking_completed",
  "dismissed",
  "reported",
] as const;

export type AdEventType = (typeof AD_EVENT_TYPES)[number];

export const AD_PLACEMENT_SURFACES = [
  "map",
  "provider_finder",
  "marketplace",
  "events",
] as const;

export type AdPlacementSurface = (typeof AD_PLACEMENT_SURFACES)[number];

export const AD_TARGETING_RULE_KINDS = [
  "service_category",
  "suburb_postcode",
  "map_viewport",
  "access_feature",
  "provider_finder_context",
  "event_category",
] as const;

export type AdTargetingRuleKind = (typeof AD_TARGETING_RULE_KINDS)[number];

/** Fields that must never be used for ad targeting. */
export const PROHIBITED_TARGETING_FIELDS = [
  "diagnosis",
  "clinical_notes",
  "ndis_plan",
  "incident_history",
  "safeguarding_status",
  "child_status",
  "private_messages",
  "exact_home_address",
] as const;

export type ProhibitedTargetingField =
  (typeof PROHIBITED_TARGETING_FIELDS)[number];

export const mapViewportSchema = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
});

export type MapViewport = z.infer<typeof mapViewportSchema>;

export const adSearchContextSchema = z.object({
  surface: z.enum(AD_PLACEMENT_SURFACES),
  adTypes: z.array(z.enum(AD_TYPES)).optional(),
  serviceCategories: z.array(z.string()).optional(),
  suburb: z.string().optional(),
  postcode: z.string().optional(),
  state: z.string().optional(),
  accessFeatureTerms: z.array(z.string()).optional(),
  providerFinderQuery: z.string().optional(),
  eventCategory: z.string().optional(),
  viewport: mapViewportSchema.optional(),
  sessionToken: z.string().optional(),
  userId: z.string().optional(),
});

export type AdSearchContext = z.infer<typeof adSearchContextSchema>;

export const adMapQuerySchema = adSearchContextSchema.extend({
  surface: z.literal("map"),
  adTypes: z
    .array(z.enum(AD_TYPES))
    .default(["sponsored_provider_pin", "sponsored_service_zone"]),
});

export const adProviderFinderQuerySchema = adSearchContextSchema.extend({
  surface: z.literal("provider_finder"),
  adTypes: z
    .array(z.enum(AD_TYPES))
    .default(["sponsored_provider_card", "local_campaign_banner"]),
});

export const adEventPayloadSchema = z.object({
  campaignId: z.string().min(1),
  creativeId: z.string().optional(),
  eventType: z.enum(AD_EVENT_TYPES),
  placementSurface: z.enum(AD_PLACEMENT_SURFACES).optional(),
  sessionToken: z.string().optional(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

export type AdEventPayload = z.infer<typeof adEventPayloadSchema>;

export const adUserActionSchema = z.object({
  campaignId: z.string().min(1),
  actionType: z.enum(["hidden", "reported"]),
  sessionToken: z.string().optional(),
  reason: z.string().max(500).optional(),
});

export type AdUserActionPayload = z.infer<typeof adUserActionSchema>;

export const adTargetingRuleInputSchema = z.object({
  ruleKind: z.enum(AD_TARGETING_RULE_KINDS),
  ruleValue: z.record(z.string(), z.unknown()),
});

export const adCreativeInputSchema = z.object({
  headline: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  ctaLabel: z.string().max(40).optional(),
  ctaUrl: z.string().url().optional(),
  providerProfileId: z.string().optional(),
  providerOutletKey: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrl: z.string().url().optional(),
});

export const createAdCampaignSchema = z.object({
  name: z.string().min(1).max(120),
  adType: z.enum(AD_TYPES),
  dailyBudgetCents: z.number().int().min(0).default(0),
  totalBudgetCents: z.number().int().min(0).default(0),
  bidAmountCents: z.number().int().min(0).default(0),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  creative: adCreativeInputSchema,
  targetingRules: z.array(adTargetingRuleInputSchema).default([]),
});

export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;

export const updateAdCampaignSchema = createAdCampaignSchema
  .partial()
  .extend({
    status: z.enum(AD_CAMPAIGN_STATUSES).optional(),
  });

export type UpdateAdCampaignInput = z.infer<typeof updateAdCampaignSchema>;

export const adReviewDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  notes: z.string().max(1000).optional(),
});

export type AdReviewDecisionInput = z.infer<typeof adReviewDecisionSchema>;

/** Public ad payload returned to clients — no sensitive targeting internals. */
export interface SponsoredAdResult {
  campaignId: string;
  creativeId: string;
  adType: AdType;
  headline: string;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  providerOutletKey?: string | null;
  providerProfileId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  isSponsored: true;
  relevanceScore: number;
  targetingSummary: string[];
  verificationPassed: boolean;
}

export interface AdSelectionResult {
  ads: SponsoredAdResult[];
  attributionNote: string;
}
