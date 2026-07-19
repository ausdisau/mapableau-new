import { z } from "zod";

export const barrierCategorySchema = z.enum([
  "entrance",
  "lift",
  "toilet",
  "parking_dropoff",
  "path_surface",
  "signage",
  "communication",
  "sensory_environment",
  "website_booking",
  "staff_service_process",
  "incorrect_mapable_information",
  "other",
]);

export const barrierReportSchema = z
  .object({
    category: barrierCategorySchema,
    description: z.string().min(10).max(4000),
    placeId: z.string().max(120).optional(),
    placeSlug: z.string().max(200).optional(),
    placeName: z.string().max(200).optional(),
    serviceId: z.string().max(120).optional(),
    locationDetail: z.string().max(500).optional(),
    urgency: z.enum(["low", "standard", "high", "safety_critical"]).default("standard"),
    observedAt: z.string().datetime().optional(),
    imageUrl: z.string().url().max(2000).optional(),
    imageDescription: z.string().max(1000).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(40).optional(),
    anonymous: z.boolean().default(false),
    consentToContact: z.boolean().default(false),
    isDraft: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.isDraft && value.description.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Describe the barrier in at least 10 characters.",
        path: ["description"],
      });
    }
    if (value.imageUrl && !value.imageDescription?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a short description of the image.",
        path: ["imageDescription"],
      });
    }
    if (
      !value.anonymous &&
      (value.contactEmail || value.contactPhone) &&
      !value.consentToContact
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirm consent before sharing contact details.",
        path: ["consentToContact"],
      });
    }
  });

export function createBarrierReferenceNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ABR-${stamp}-${rand}`;
}
