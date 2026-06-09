import { z } from "zod";

export const adAdvertiserCategorySchema = z.enum([
  "ndis_provider",
  "allied_health",
  "support_coordinator",
  "plan_manager",
  "accessible_transport",
  "assistive_technology",
  "inclusive_employer",
  "accessible_tourism",
  "disability_education",
  "council_public_interest",
]);

export const adPlacementSchema = z.enum([
  "skyscraper_left",
  "skyscraper_right",
  "sponsored_provider_card",
  "banner_inline",
]);

export const SENSITIVE_TARGETING_KEYS = [
  "disabilityType",
  "disability_type",
  "diagnosis",
  "healthCondition",
  "health_condition",
  "ndisPlanValue",
  "ndis_plan_value",
  "mobilityAid",
  "mobility_aid",
  "supportNeeds",
  "support_needs",
  "age",
  "carerStress",
  "carer_stress",
  "participantProfile",
  "participant_profile",
] as const;

export const adTargetingSchema = z
  .object({
    placements: z.array(adPlacementSchema).min(1),
    pageContexts: z.array(z.string().min(1).max(80)).optional(),
    serviceCategories: z.array(z.string().min(1).max(80)).optional(),
    states: z.array(z.string().min(2).max(3)).optional(),
    deviceTypes: z.array(z.enum(["mobile", "tablet", "desktop", "unknown"])).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const raw = val as Record<string, unknown>;
    for (const key of Object.keys(raw)) {
      if ((SENSITIVE_TARGETING_KEYS as readonly string[]).includes(key)) {
        ctx.addIssue({
          code: "custom",
          message: `Sensitive targeting key "${key}" is not allowed`,
        });
      }
    }
  });

export const createAdvertiserSchema = z.object({
  organisationId: z.string().cuid(),
  category: adAdvertiserCategorySchema,
  contactName: z.string().min(1).max(120).optional(),
  contactEmail: z.string().email().optional(),
  acceptTerms: z.literal(true),
});

export const createCampaignSchema = z.object({
  name: z.string().min(3).max(200),
  budgetCents: z.number().int().positive().optional(),
  targeting: adTargetingSchema,
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  budgetCents: z.number().int().positive().optional(),
  targeting: adTargetingSchema.optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
});

export const createCreativeSchema = z.object({
  format: z.enum(["image_text", "text_only"]).default("image_text"),
  placements: z.array(adPlacementSchema).min(1),
  imageFileKey: z.string().max(500).optional(),
  imageMimeType: z.string().max(100).optional(),
  headline: z.string().min(1).max(120),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().min(1).max(60),
  altText: z.string().min(10).max(500),
  landingUrl: z.string().url().max(2000),
  targetOrganisationId: z.string().cuid().optional(),
});

export const serveAdsQuerySchema = z.object({
  placement: adPlacementSchema,
  pageContext: z.string().max(80).optional(),
  serviceCategory: z.string().max(80).optional(),
  state: z.string().max(3).optional(),
  deviceType: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
});

export const trackAdEventSchema = z.object({
  campaignId: z.string().cuid(),
  placement: adPlacementSchema,
  type: z.enum(["impression", "click"]),
  regionCode: z.string().max(10).optional(),
  deviceType: z.string().max(20).optional(),
});

export const moderateCampaignSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(2000).optional(),
});

export type AdTargetingInput = z.infer<typeof adTargetingSchema>;
