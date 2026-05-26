import { z } from "zod";

export const assessmentSectionsSchema = z.object({
  dailyLiving: z.record(z.string(), z.unknown()).optional(),
  community: z.record(z.string(), z.unknown()).optional(),
  employment: z.record(z.string(), z.unknown()).optional(),
  risks: z.record(z.string(), z.unknown()).optional(),
  communication: z.record(z.string(), z.unknown()).optional(),
  goals: z.array(z.string()).optional(),
  accessNeedsSummary: z.string().max(5000).optional(),
  communicationNotes: z.string().max(5000).optional(),
});

export const createAssessmentSchema = z.object({
  sectionsJson: assessmentSectionsSchema.optional(),
  source: z.enum(["participant_self", "coordinator", "import_placeholder"]).optional(),
});

export const updateAssessmentSchema = z.object({
  sectionsJson: assessmentSectionsSchema.optional(),
  status: z.enum(["draft", "submitted", "reviewed"]).optional(),
});

export const supportReferralTypeSchema = z.enum([
  "internal_care",
  "internal_transport",
  "internal_employment",
  "internal_provider",
  "external",
]);

export const supportReferralPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const createReferralSchema = z.object({
  assessmentId: z.string().optional(),
  referralType: supportReferralTypeSchema,
  priority: supportReferralPrioritySchema.optional(),
  summary: z.string().min(3).max(2000),
  destinationJson: z.record(z.string(), z.unknown()).optional(),
  participantId: z.string().optional(),
});

export const updateReferralSchema = z.object({
  status: z
    .enum(["draft", "submitted", "triaged", "accepted", "declined", "completed", "cancelled"])
    .optional(),
  priority: supportReferralPrioritySchema.optional(),
  summary: z.string().min(3).max(2000).optional(),
  destinationJson: z.record(z.string(), z.unknown()).optional(),
  careRequestId: z.string().optional(),
});

export const createCareRequestFromReferralSchema = z.object({
  requestType: z
    .enum([
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
    ])
    .optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
});

export const coordinatorAccessRequestSchema = z.object({
  coordinatorId: z.string().optional(),
  scopes: z.array(z.string()).min(1),
});

export const updateCoordinatorTaskSchema = z.object({
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  title: z.string().min(1).max(500).optional(),
});
