import { z } from "zod";

import {
  HUMAN_OPS_CATEGORIES,
  HUMAN_OPS_PRIORITIES,
  HUMAN_OPS_RESOLUTIONS,
  HUMAN_OPS_SOURCES,
  HUMAN_OPS_STATUSES,
} from "./types";

export const humanOpsCategorySchema = z.enum(HUMAN_OPS_CATEGORIES);
export const humanOpsPrioritySchema = z.enum(HUMAN_OPS_PRIORITIES);
export const humanOpsStatusSchema = z.enum(HUMAN_OPS_STATUSES);
export const humanOpsResolutionSchema = z.enum(HUMAN_OPS_RESOLUTIONS);
export const humanOpsSourceSchema = z.enum(HUMAN_OPS_SOURCES);

export const enqueueHumanOpsReviewSchema = z.object({
  participantId: z.string().min(1),
  tenantId: z.string().min(1),
  missionId: z.string().nullable().optional(),
  category: humanOpsCategorySchema,
  priority: humanOpsPrioritySchema.optional(),
  reasonCodes: z.array(z.string().min(1)).min(1).max(20),
  evidenceRefs: z.array(z.string()).max(50).optional(),
  requestedBy: z.string().min(1),
  source: humanOpsSourceSchema,
  sourceReviewItemId: z.string().nullable().optional(),
  participantFacingReason: z.string().min(3).max(1000),
  dueAt: z.string().datetime().nullable().optional(),
  handlingTeam: z.string().max(120).optional(),
});

export const assignHumanOpsReviewSchema = z.object({
  assigneeId: z.string().min(1),
  note: z.string().max(1000).optional(),
});

export const requestInfoHumanOpsSchema = z.object({
  informationRequested: z.string().min(3).max(2000),
  fromParticipant: z.boolean().default(true),
});

export const resolveHumanOpsReviewSchema = z.object({
  resolution: humanOpsResolutionSchema,
  resolutionReason: z.string().min(3).max(2000),
  evidenceRefsUsed: z.array(z.string()).max(50).default([]),
  decidedUnderAuthority: z.string().min(3).max(200),
  participantApprovalBypassed: z.literal(false),
  delegateAuthorityId: z.string().nullable().default(null),
  nextStepsPrepared: z.array(z.string().max(200)).max(20).default([]),
  internalNote: z.string().max(2000).optional(),
});

export const patchHumanOpsReviewSchema = z.object({
  status: humanOpsStatusSchema.optional(),
  priority: humanOpsPrioritySchema.optional(),
  internalNote: z.string().max(2000).optional(),
  whatHappensNext: z.string().max(1000).optional(),
});

export const humanOpsQueueQuerySchema = z.object({
  status: z
    .union([humanOpsStatusSchema, z.array(humanOpsStatusSchema)])
    .optional(),
  category: z
    .union([humanOpsCategorySchema, z.array(humanOpsCategorySchema)])
    .optional(),
  missionId: z.string().optional(),
  participantId: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z
    .union([humanOpsPrioritySchema, z.array(humanOpsPrioritySchema)])
    .optional(),
});
