import { z } from "zod";

const ratingValue = z
  .number()
  .int()
  .min(0)
  .max(5)
  .nullable()
  .optional();

export const createMarkerRatingSchema = z.object({
  overallRating: ratingValue,
  mobilityRating: ratingValue,
  toiletRating: ratingValue,
  parkingDropoffRating: ratingValue,
  sensoryRating: ratingValue,
  communicationRating: ratingValue,
  staffServiceRating: ratingValue,
  visitedInPerson: z.boolean().default(true),
  visitedAt: z.string().datetime().optional().nullable(),
  usedMobilityAid: z.boolean().optional().nullable(),
  mobilityAidType: z
    .enum([
      "manual_wheelchair",
      "powerchair",
      "mobility_scooter",
      "walker",
      "cane",
      "other",
    ])
    .optional()
    .nullable(),
});

export const createMarkerCommentSchema = z.object({
  commentType: z.enum([
    "general",
    "mobility",
    "toilet",
    "parking",
    "sensory",
    "communication",
    "staff_service",
    "temporary_alert",
    "transport_dropoff",
    "correction",
  ]),
  body: z.string().min(10).max(2000),
  ratingId: z.string().cuid().optional(),
  evidencePhotoIds: z.array(z.string()).max(5).optional(),
  privacyConfirmed: z.boolean().refine((v) => v === true, {
    message:
      "You must confirm you have not included private information or photos of people without consent.",
  }),
});

export const verifyMarkerSchema = z.object({
  action: z.enum([
    "confirm_accurate",
    "mark_outdated",
    "dispute",
    "resolve_alert",
    "suggest_evidence",
  ]),
  note: z.string().max(1000).optional(),
  commentId: z.string().cuid().optional(),
  evidenceNote: z.string().max(2000).optional(),
});

export const reportMarkerCommentSchema = z.object({
  reason: z.enum([
    "inaccurate_access_information",
    "abusive_or_harassing",
    "private_information",
    "defamatory_or_unverified_claim",
    "unsafe_advice",
    "spam",
    "other",
  ]),
  details: z.string().max(2000).optional(),
});
