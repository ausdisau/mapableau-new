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

const contactFields = {
  category: barrierCategorySchema,
  placeId: z.string().max(120).optional(),
  placeSlug: z.string().max(200).optional(),
  placeName: z.string().max(200).optional(),
  serviceId: z.string().max(120).optional(),
  locationDetail: z.string().max(500).optional(),
  urgency: z
    .enum(["low", "standard", "high", "safety_critical"])
    .default("standard"),
  observedAt: z.string().datetime().optional(),
  imageDescription: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
  anonymous: z.boolean().default(false),
  consentToContact: z.boolean().default(false),
  /** Rejected when present — remote URL is not a safe upload. */
  imageUrl: z.undefined().optional(),
};

/** Partial drafts may have empty or short descriptions. */
export const barrierReportDraftSchema = z
  .object({
    ...contactFields,
    description: z.string().max(4000).default(""),
    isDraft: z.literal(true),
  })
  .strict();

/** Final submissions require meaningful content. */
export const barrierReportSubmitSchema = z
  .object({
    ...contactFields,
    description: z.string().min(10).max(4000),
    isDraft: z.literal(false).default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.description.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Describe the barrier in at least 10 characters.",
        path: ["description"],
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

export function parseBarrierReportBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return barrierReportSubmitSchema.safeParse(raw);
  }
  const record = { ...(raw as Record<string, unknown>) };
  if (record.imageUrl === "" || record.imageUrl == null) {
    delete record.imageUrl;
  }
  if (record.isDraft === true) {
    return barrierReportDraftSchema.safeParse({ ...record, isDraft: true });
  }
  return barrierReportSubmitSchema.safeParse({ ...record, isDraft: false });
}

/** Compatibility wrapper for tests and callers expecting Zod-like API. */
export const barrierReportSchema = {
  safeParse: parseBarrierReportBody,
  parse(raw: unknown) {
    const result = parseBarrierReportBody(raw);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  },
};

export function createBarrierReferenceNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ABR-${stamp}-${rand}`;
}
