import { z } from "zod";

export const careRequestTypeSchema = z.enum([
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

export const createCareRequestSchema = z.object({
  requestType: careRequestTypeSchema,
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(5000),
  preferredDate: z.string().datetime().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  accessRequirementsSummary: z.string().optional(),
  linkedTransportRequired: z.boolean().optional(),
  shareAccessibility: z.boolean().optional(),
  shareAccessibilityConfirmed: z.boolean().optional(),
  fundingSourceId: z.string().optional(),
  tasks: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const createCareShiftSchema = z.object({
  careRequestId: z.string(),
  organisationId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().optional(),
  workerProfileId: z.string().optional(),
});

export const assignCareProviderSchema = z.object({
  organisationId: z.string(),
});
