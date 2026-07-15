import { z } from "zod";

export const accessReviewRatingSchema = z.object({
  category: z.string(),
  value: z.enum([
    "not_applicable",
    "unknown",
    "not_observed",
    "very_difficult",
    "difficult",
    "mixed",
    "poor",
    "basic",
    "good",
    "very_good",
    "excellent",
  ]),
});

export const accessFeatureTagSchema = z.object({
  tagKey: z.string().min(1).max(80),
  sentiment: z.enum(["positive", "barrier"]),
});

export const createAccessReviewSchema = z.object({
  displayNameMode: z
    .enum(["named", "first_name", "anonymous_public"])
    .default("anonymous_public"),
  visitDate: z.string().datetime().optional(),
  visitTimePrecision: z.enum(["none", "approximate", "exact"]).optional(),
  observationSource: z
    .enum(["in_person", "venue_inspection", "other"])
    .optional(),
  overallExperience: z
    .enum([
      "completely",
      "mostly",
      "partly",
      "barely",
      "not_at_all",
      "prefer_not",
    ])
    .optional(),
  temporaryIssue: z.boolean().optional(),
  reviewBody: z.string().min(10).max(8000),
  mobilityContext: z.string().max(500).optional(),
  accessContextJson: z.array(z.string()).max(20).optional(),
  visibility: z.enum(["public", "mapable_only"]).default("public"),
  publish: z.boolean().default(true),
  ratings: z.array(accessReviewRatingSchema).min(1),
  featureTags: z.array(accessFeatureTagSchema).max(40).optional(),
});

export const updateAccessReviewSchema = z
  .object({
    reviewBody: z.string().min(10).max(8000).optional(),
    mobilityContext: z.string().max(500).optional(),
    publish: z.boolean().optional(),
    overallExperience: z
      .enum([
        "completely",
        "mostly",
        "partly",
        "barely",
        "not_at_all",
        "prefer_not",
      ])
      .optional(),
    temporaryIssue: z.boolean().optional(),
    ratings: z.array(accessReviewRatingSchema).optional(),
    featureTags: z.array(accessFeatureTagSchema).optional(),
    visitDate: z.string().datetime().optional(),
    visitTimePrecision: z.enum(["none", "approximate", "exact"]).optional(),
    observationSource: z
      .enum(["in_person", "venue_inspection", "other"])
      .optional(),
    accessContextJson: z.array(z.string()).max(20).optional(),
    displayNameMode: z
      .enum(["named", "first_name", "anonymous_public"])
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field required",
  });

export const createAccessCommentSchema = z.object({
  body: z.string().min(2).max(4000),
  commentType: z.enum([
    "access_tip",
    "barrier_report",
    "temporary_issue",
    "feature_confirmation",
    "question",
    "venue_response",
    "improvement_update",
  ]),
  featureKey: z
    .enum([
      "whole_place",
      "parking",
      "drop_off",
      "path",
      "entrance",
      "door",
      "interior_path",
      "ramp",
      "lift",
      "counter",
      "seating",
      "toilet",
      "signage",
      "hearing_access",
      "lighting_acoustics",
      "staff_assistance",
      "online_information",
    ])
    .optional(),
  reviewId: z.string().optional(),
  parentCommentId: z.string().optional(),
});

export const reactionSchema = z.object({
  targetType: z.enum(["review", "comment"]),
  targetId: z.string().min(1),
  reactionType: z.enum(["helpful", "confirm", "changed"]),
  active: z.boolean().default(true),
});

export const contentReportSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  reason: z.enum([
    "inaccurate_access_information",
    "outdated_information",
    "privacy_concern",
    "abusive_or_harassing",
    "private_information",
    "defamatory_or_unverified_claim",
    "suspected_fake_contribution",
    "conflict_of_interest",
    "unsafe_advice",
    "inappropriate_media",
    "serious_safety_concern",
    "spam",
    "duplicate_place",
    "closed_or_moved_place",
    "other",
  ]),
  details: z.string().max(4000).optional(),
});
