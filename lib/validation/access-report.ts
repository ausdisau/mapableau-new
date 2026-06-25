import { z } from "zod";

import { accessReviewRatingSchema } from "@/lib/validation/access-review";

export const accessReportTypeSchema = z.enum([
  "venue",
  "route",
  "toilet",
  "parking",
  "transport_stop",
  "sensory",
  "temporary_alert",
  "entrance",
]);

export const accessMeasurementSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.number(),
  unit: z.string().min(1).max(20),
});

export const createAccessReportSchema = z.object({
  reportType: accessReportTypeSchema.default("venue"),
  displayNameMode: z
    .enum(["named", "first_name", "anonymous_public"])
    .default("anonymous_public"),
  visitDate: z.string().datetime().optional(),
  reviewBody: z.string().min(10).max(8000),
  mobilityContext: z.string().max(500).optional(),
  evidenceNotes: z.string().max(2000).optional(),
  visitedInPerson: z.boolean().default(false),
  measurements: z.array(accessMeasurementSchema).optional(),
  visibility: z.enum(["public", "mapable_only"]).default("public"),
  publish: z.boolean().default(false),
  ratings: z.array(accessReviewRatingSchema).min(1),
});

export const updateAccessReportSchema = z
  .object({
    reportType: accessReportTypeSchema.optional(),
    reviewBody: z.string().min(10).max(8000).optional(),
    mobilityContext: z.string().max(500).optional(),
    evidenceNotes: z.string().max(2000).optional(),
    visitedInPerson: z.boolean().optional(),
    measurements: z.array(accessMeasurementSchema).optional(),
    visitDate: z.string().datetime().optional(),
    publish: z.boolean().optional(),
    ratings: z.array(accessReviewRatingSchema).optional(),
  })
  .refine(
    (v) =>
      v.reviewBody != null ||
      v.mobilityContext != null ||
      v.publish != null ||
      v.ratings != null ||
      v.reportType != null,
    { message: "At least one field required" }
  );

export type CreateAccessReportInput = z.infer<typeof createAccessReportSchema>;
export type UpdateAccessReportInput = z.infer<typeof updateAccessReportSchema>;
