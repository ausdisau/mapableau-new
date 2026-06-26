import { z } from "zod";

import { ASSESSMENT_DOMAINS } from "@/lib/digital-twin/constants";

export const twinPlaceTypeSchema = z.enum([
  "venue",
  "clinic",
  "workplace",
  "school",
  "home",
  "transport_hub",
  "park",
  "event_site",
  "government_service",
  "other",
]);

export const twinPlaceStatusSchema = z.enum([
  "draft",
  "published",
  "under_review",
  "archived",
]);

export const twinIssueTypeSchema = z.enum([
  "access_barrier",
  "outdated_info",
  "safety",
  "privacy",
  "maintenance",
  "discrimination",
  "service_quality",
  "other",
]);

export const twinIssueSeveritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const twinEvidenceTypeSchema = z.enum([
  "assessor_note",
  "user_review",
  "photo",
  "measurement",
  "venue_declaration",
  "document",
  "sensor_status",
  "complaint",
  "maintenance_update",
  "staff_training_record",
  "imported_dataset",
]);

export const createTwinPlaceSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  placeType: twinPlaceTypeSchema,
  description: z.string().max(5000).optional(),
  address: z.string().max(500),
  region: z.string().max(120),
  geo: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  privacy: z.enum(["public", "restricted", "private"]).default("public"),
});

export const patchTwinPlaceSchema = createTwinPlaceSchema.partial();

export const submitEvidenceSchema = z.object({
  placeId: z.string().min(1),
  featureId: z.string().optional(),
  evidenceType: twinEvidenceTypeSchema,
  title: z.string().min(2).max(200),
  summary: z.string().min(10).max(5000),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  measurementNotes: z.string().max(2000).optional(),
  consentToPublish: z
    .boolean()
    .refine((v) => v === true, {
      message: "You must consent to submit this evidence for review.",
    }),
});

export const submitIssueSchema = z.object({
  placeId: z.string().min(1),
  featureId: z.string().optional(),
  issueType: twinIssueTypeSchema,
  severity: twinIssueSeveritySchema,
  summary: z.string().min(10).max(2000),
  details: z.string().max(5000).optional(),
  dateObserved: z.string().optional(),
  wantsFollowUp: z.boolean().default(false),
  contactEmail: z.string().email().optional(),
  allowAnonymousDisplay: z.boolean().default(false),
});

export const compatibilityRequestSchema = z.object({
  placeId: z.string().min(1),
  profileId: z.string().optional(),
  manualNeeds: z
    .object({
      wheelchairOrMobilityAid: z.boolean().optional(),
      needsStepFreeEntrance: z.boolean().optional(),
      needsAccessibleToilet: z.boolean().optional(),
      needsQuietSpace: z.boolean().optional(),
      needsHearingSupport: z.boolean().optional(),
      needsPlainLanguageInfo: z.boolean().optional(),
      needsAssistanceAnimalReadiness: z.boolean().optional(),
      needsRampVehicleDropoff: z.boolean().optional(),
      needsFatigueBuffer: z.boolean().optional(),
    })
    .optional(),
});

export const consentCheckSchema = z.object({
  ownerUserId: z.string().min(1),
  recipientType: z.enum([
    "provider",
    "venue",
    "employer",
    "transport_operator",
    "support_coordinator",
    "family",
    "council",
    "admin",
    "other",
  ]),
  dataCategories: z.array(z.string()).min(1),
  purpose: z.string().min(5).max(500),
});

export const twinPlaceFilterSchema = z.object({
  placeType: twinPlaceTypeSchema.optional(),
  minTier: z.enum(["none", "bronze", "silver", "gold"]).optional(),
  hasAccessibleToilet: z.coerce.boolean().optional(),
  stepFreeEntrance: z.coerce.boolean().optional(),
  quietSpace: z.coerce.boolean().optional(),
  transportConnection: z.coerce.boolean().optional(),
});

export const assessmentDomainSchema = z.enum(ASSESSMENT_DOMAINS);
