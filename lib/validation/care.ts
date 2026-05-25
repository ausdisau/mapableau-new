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
  tasks: z
    .array(
      z.object({
        label: z.string().min(1),
        intensity: z.string().optional(),
      })
    )
    .optional(),
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

export const createCareBookingSchema = z.object({
  careRequestId: z.string(),
});

export const assignCareWorkerSchema = z.object({
  workerProfileId: z.string(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const serviceLogSchema = z.object({
  shiftId: z.string(),
  supportItems: z.array(z.record(z.string(), z.unknown())).optional(),
  tasksCompleted: z.array(z.record(z.string(), z.unknown())).optional(),
  workerNotes: z.string().optional(),
});

export const confirmServiceLogSchema = z.object({
  notes: z.string().optional(),
});

export const disputeServiceLogSchema = z.object({
  reason: z.string().min(3).max(1000),
});

export const invoicePlaceholderSchema = z.object({
  pricingPlaceholder: z.string().optional(),
  ndisLineItemCodePlaceholder: z.string().optional(),
});

export const careIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(5000),
  category: z.string().default("safety"),
  severity: z.string().default("medium"),
  shiftId: z.string().optional(),
  immediateRiskPresent: z.boolean().optional(),
  safeguardingConcern: z.boolean().optional(),
});
