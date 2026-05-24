import { z } from "zod";

export const therapyAppointmentSchema = z.object({
  therapistProfileId: z.string(),
  therapyType: z.enum([
    "physiotherapy",
    "occupational_therapy",
    "speech_pathology",
    "exercise_physiology",
    "psychology",
    "other",
  ]),
  deliveryMode: z.enum(["telehealth", "home_visit", "clinic"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().optional(),
  transportRequired: z.boolean().optional(),
});

export const homeVisitRiskCheckSchema = z.object({
  accessClear: z.boolean(),
  petsDisclosed: z.boolean(),
  supportPersonPresent: z.boolean(),
  hazardsNoted: z.string().optional(),
});

export const progressNoteSchema = z.object({
  clinicalContent: z.string().min(10).max(10000),
  participantSummary: z.string().min(10).max(2000),
});

export const equipmentRecommendationSchema = z.object({
  itemName: z.string().min(2),
  marketplaceUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
