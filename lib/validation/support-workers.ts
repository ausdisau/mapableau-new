import { z } from "zod";

const supportTypeSchema = z.enum([
  "personal_care",
  "domestic_assistance",
  "community_access",
  "appointment_support",
  "employment_support",
  "meal_preparation",
  "therapy_assistance",
  "skill_building",
  "overnight_support",
  "other",
]);

export const supportRequestSchema = z.object({
  supportType: supportTypeSchema,
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  requiredCapabilities: z.array(z.string()).optional(),
  communicationModes: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  preferredGender: z.string().max(50).optional(),
  maxDistanceKm: z.number().min(1).max(500).optional(),
  requiresBehaviourSupportPlan: z.boolean().optional(),
  excludeWorkerIds: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).optional(),
});

export const supportSearchQuerySchema = z.object({
  support_type: supportTypeSchema.optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  required_capabilities: z.string().optional(),
  communication_modes: z.string().optional(),
  languages: z.string().optional(),
  preferred_gender: z.string().max(50).optional(),
  max_distance_km: z.coerce.number().min(1).max(500).optional(),
  take: z.coerce.number().min(1).max(50).optional(),
  skip: z.coerce.number().min(0).optional(),
  participant_id: z.string().optional(),
});

export const matchEventSchema = z.object({
  eventType: z.enum([
    "search",
    "match_run",
    "save_preferred",
    "hide",
    "reject",
    "request_more",
    "select",
  ]),
  workerProfileId: z.string().min(1),
  matchRunId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export function parseCommaList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
