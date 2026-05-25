import { z } from "zod";

export const peerDisplayNameModeSchema = z.enum([
  "real_name",
  "first_name_only",
  "community_alias",
  "anonymous_public",
]);

export const peerProfileVisibilitySchema = z.enum([
  "private",
  "circles_only",
  "mentors_only",
  "community",
]);

export const createPeerProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
  displayNameMode: peerDisplayNameModeSchema.default("community_alias"),
  livedExperienceTags: z.array(z.string()).optional(),
  communicationPreferences: z.record(z.string(), z.unknown()).optional(),
  profileVisibility: peerProfileVisibilitySchema.default("circles_only"),
});

export const updatePeerProfileSchema = createPeerProfileSchema.partial();

export const updatePeerPrivacySchema = z.object({
  pauseCommunityNotifications: z.boolean().optional(),
  lockScreenSafeOnly: z.boolean().optional(),
  mutedCircleIds: z.array(z.string()).optional(),
});

export const createPeerCirclePostSchema = z.object({
  body: z.string().min(1).max(10000),
  contentWarning: z.string().max(200).optional(),
});

export const createPeerReplySchema = z.object({
  body: z.string().min(1).max(5000),
});

export const createPeerQuestionSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(10000),
  topic: z.string().max(100).optional(),
});

export const createPeerAnswerSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const createPeerStorySchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(20000),
  resourceUrl: z.string().url().optional().or(z.literal("")),
  contentWarning: z.string().max(200).optional(),
});

export const createPeerMentorProfileSchema = z.object({
  bio: z.string().min(20).max(2000),
  livedExperienceTopics: z.array(z.string()).default([]),
  boundaries: z.string().max(1000).optional(),
  availabilityNotes: z.string().max(500).optional(),
});

export const createPeerMentorRequestSchema = z.object({
  message: z.string().max(1000).optional(),
});

export const createPeerReportSchema = z.object({
  contentType: z.string().min(1),
  contentId: z.string().min(1),
  reason: z.enum([
    "abuse_or_harassment",
    "privacy_violation",
    "unsafe_advice",
    "medical_or_legal_claim",
    "self_harm_or_crisis",
    "discrimination",
    "spam",
    "exploitation_or_scam",
    "boundary_issue",
    "other",
  ]),
  details: z.string().max(2000).optional(),
});

export const moderationDecisionSchema = z.object({
  decision: z.enum([
    "approve",
    "hide",
    "request_edit",
    "warn_user",
    "pause_account",
    "remove_from_circle",
    "escalate_support",
    "escalate_complaint",
    "escalate_safeguarding",
  ]),
  notes: z.string().max(2000).optional(),
});

export const safetyEscalationSchema = z.object({
  peerProfileId: z.string().optional(),
  contentType: z.string().optional(),
  contentId: z.string().optional(),
  eventType: z.enum([
    "crisis_resources_shown",
    "member_reported_crisis",
    "moderator_escalation",
    "automated_flag",
  ]),
  description: z.string().max(2000).optional(),
});

export const adminCreatePeerCircleSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  topic: z.string().min(1).max(100),
  circleType: z
    .enum(["open", "moderated", "invite_only", "peer_mentor_led", "program_based"])
    .default("moderated"),
  accessibilityNotes: z.string().max(1000).optional(),
  moderationLevel: z.string().default("standard"),
});

export const adminCreatePeerEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  facilitatorName: z.string().max(200).optional(),
  accessibilityOptions: z.record(z.string(), z.unknown()).optional(),
  capacity: z.number().int().positive().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  locationType: z.enum(["online", "in_person", "hybrid"]).default("online"),
  meetingLinkPlaceholder: z.string().max(500).optional(),
});
