import { z } from "zod";

export const emergencyProfileSchema = z.object({
  mobilitySummary: z.string().max(2000).optional(),
  communicationNeeds: z.string().max(2000).optional(),
  supportNeedsSummary: z.string().max(2000).optional(),
  defaultPickupAddress: z.string().max(500).optional(),
  nomineeCanManage: z.boolean().optional(),
  sharedWithCoordinator: z.boolean().optional(),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal("")),
  relationship: z.string().max(80).optional(),
  isPrimary: z.boolean().optional(),
  notifyOnNeedHelp: z.boolean().optional(),
});

export const evacuationPlanSchema = z.object({
  planType: z.enum(["home", "work", "other"]).optional(),
  title: z.string().min(2).max(120),
  meetingPoint: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  steps: z
    .array(
      z.object({
        instruction: z.string().min(1).max(1000),
        estimatedMinutes: z.number().int().min(0).optional(),
      }),
    )
    .min(1),
});

export const criticalAccessNoteSchema = z.object({
  category: z.string().max(64).optional(),
  title: z.string().min(2).max(120),
  content: z.string().min(1).max(5000),
});

export const emergencyTransportSchema = z.object({
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  urgencyNotes: z.string().max(1000).optional(),
});

export const emergencyCheckInSchema = z.object({
  status: z.enum(["safe", "need_help"]),
  message: z.string().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  shareLocation: z.boolean().optional(),
});

export const disasterSubscribeSchema = z.object({
  regionCode: z.string().min(2).max(32),
});
