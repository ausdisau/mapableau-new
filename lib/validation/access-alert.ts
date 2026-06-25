import { z } from "zod";

export const accessAlertTypeSchema = z.enum([
  "broken_lift",
  "blocked_ramp",
  "inaccessible_toilet",
  "construction_barrier",
  "inaccessible_transport_stop",
  "temporary_closure",
  "crowding_sensory_risk",
  "urgent_hazard",
]);

export const createAccessAlertSchema = z.object({
  placeId: z.string().optional(),
  reportId: z.string().optional(),
  alertType: accessAlertTypeSchema,
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  expiresAt: z.string().datetime().optional(),
  reviewAt: z.string().datetime().optional(),
});

export const updateAccessAlertSchema = z.object({
  status: z.enum(["active", "resolved", "expired", "disputed"]).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const accessVerifySchema = z.object({
  entityType: z.enum(["AccessPlaceReview", "AccessAlert", "AccessPlace"]),
  entityId: z.string(),
  action: z.enum([
    "confirm",
    "outdated",
    "dispute",
    "add_evidence",
    "resolve_alert",
    "suggest_edit",
  ]),
  notes: z.string().max(2000).optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});

export type CreateAccessAlertInput = z.infer<typeof createAccessAlertSchema>;
export type UpdateAccessAlertInput = z.infer<typeof updateAccessAlertSchema>;
