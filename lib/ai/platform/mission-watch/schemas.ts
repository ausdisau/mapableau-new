import { z } from "zod";

import {
  MISSION_WATCH_TYPES,
  PARTICIPANT_WATCH_ACTIONS,
  WATCH_SEVERITIES,
} from "./types";

export const watchConditionSchema = z.object({
  deadlineIso: z.string().datetime().nullable().optional(),
  approvalExpiresAt: z.string().datetime().nullable().optional(),
  evidenceObservedAt: z.string().datetime().nullable().optional(),
  evidenceMaxAgeMinutes: z.number().int().min(1).max(525_600).nullable().optional(),
  transportConfirmed: z.boolean().nullable().optional(),
  serviceConfirmed: z.boolean().nullable().optional(),
  dependencyNodeIds: z.array(z.string().min(1).max(120)).max(50).optional(),
  dependencyHealthy: z.boolean().nullable().optional(),
  humanReviewPending: z.boolean().nullable().optional(),
  reminderMessage: z.string().max(500).nullable().optional(),
  requiredConsentScopes: z.array(z.string().min(1).max(80)).max(20).optional(),
  optional: z.boolean().optional(),
  bufferMinutes: z.number().int().min(0).max(10_080).optional(),
  leadTimeMinutes: z.number().int().min(0).max(10_080).optional(),
  warnBeforeMinutes: z.number().int().min(1).max(43_200).optional(),
});

export const createWatchBodySchema = z.object({
  watchType: z.enum(MISSION_WATCH_TYPES),
  triggerAt: z.string().datetime().nullable().optional(),
  condition: watchConditionSchema.optional(),
  affectedNodeIds: z.array(z.string().min(1).max(120)).max(50).optional(),
  participantVisible: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  timeZone: z.string().min(1).max(80).optional(),
  severity: z.enum(WATCH_SEVERITIES).optional(),
  optional: z.boolean().optional(),
  nextEvaluationAt: z.string().datetime().nullable().optional(),
});

export const snoozeWatchBodySchema = z.object({
  minutes: z.number().int().min(5).max(10_080).default(60),
});

export const participantWatchActionBodySchema = z.object({
  action: z.enum(PARTICIPANT_WATCH_ACTIONS),
  minutes: z.number().int().min(5).max(10_080).optional(),
});

export const tickWatchBodySchema = z.object({
  referenceTime: z.string().datetime().optional(),
  actorConsentScopes: z.array(z.string().min(1).max(80)).max(40).optional(),
  revokedConsentScopes: z.array(z.string().min(1).max(80)).max(40).optional(),
  ingestRecoveryEvents: z.boolean().optional(),
});

export type CreateWatchBody = z.infer<typeof createWatchBodySchema>;
export type SnoozeWatchBody = z.infer<typeof snoozeWatchBodySchema>;
export type TickWatchBody = z.infer<typeof tickWatchBodySchema>;
