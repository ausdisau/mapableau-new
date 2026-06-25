import { z } from "zod";

import { accessReviewRatingSchema } from "@/lib/validation/access-review";

export const accessReportTypeSchema = z.enum([
  "venue",
  "route",
  "toilet",
  "parking",
  "entrance",
  "transport_stop",
  "sensory",
  "temporary_alert",
]);

export const measurementSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.number(),
  unit: z.enum(["mm", "cm", "m", "degrees", "percent"]),
});

export type Measurement = z.infer<typeof measurementSchema>;

export const createAccessReportSchema = z.object({
  reportType: accessReportTypeSchema.default("venue"),
  displayNameMode: z
    .enum(["named", "first_name", "anonymous_public"])
    .default("anonymous_public"),
  visitDate: z.string().datetime().optional(),
  reviewBody: z.string().min(10).max(8000),
  mobilityContext: z.string().max(500).optional(),
  visitedInPerson: z.boolean().default(true),
  measurements: z.array(measurementSchema).max(10).optional(),
  visibility: z.enum(["public", "mapable_only"]).default("public"),
  publish: z.boolean().default(false),
  draftKey: z.string().max(100).optional(),
  ratings: z.array(accessReviewRatingSchema).min(1),
});

export const updateAccessReportSchema = createAccessReportSchema
  .partial()
  .refine(
    (v) =>
      v.reviewBody != null ||
      v.ratings != null ||
      v.publish != null ||
      v.reportType != null,
    { message: "At least one field required" }
  );

export const accessAlertTypeSchema = z.enum([
  "broken_lift",
  "blocked_ramp",
  "inaccessible_toilet",
  "construction_barrier",
  "inaccessible_transport_stop",
  "temporary_closure",
  "crowding_risk",
  "sensory_overload",
  "urgent_hazard",
  "other",
]);

export const createAccessAlertSchema = z.object({
  alertType: accessAlertTypeSchema,
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const accessVerificationSchema = z.object({
  targetType: z.enum(["review", "alert", "place_feature"]),
  targetId: z.string(),
  action: z.enum(["confirm", "outdated", "dispute", "resolve", "suggest_edit"]),
  notes: z.string().max(2000).optional(),
});
