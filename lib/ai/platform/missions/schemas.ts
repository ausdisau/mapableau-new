import { z } from "zod";

import { mapAbleModuleSchema } from "@/intelligence/types";

import {
  MISSION_ACTION_TYPES,
  MISSION_NODE_STATUSES,
  MISSION_NODE_TYPES,
  MISSION_PLAN_STATUSES,
  MISSION_SOURCES,
} from "./types";

export const missionRequestSchema = z
  .object({
    objective: z.string().trim().min(3).max(4000),
    lifeIntentId: z.string().min(1).max(120).optional(),
    requestedDomains: z.array(mapAbleModuleSchema).max(8).optional(),
    communicationPreferences: z.array(z.string().max(80)).max(20).optional(),
    requestedUseOfAccessibilityProfile: z.boolean().default(false),
    plainLanguage: z.boolean().default(true),
    consentScopes: z.array(z.string().max(80)).max(20).default([]),
    source: z.enum(MISSION_SOURCES).default("participant_text"),
    addedDomains: z.array(mapAbleModuleSchema).max(8).optional(),
    removedDomains: z.array(mapAbleModuleSchema).max(8).optional(),
    profileConsentGranted: z.boolean().optional(),
  })
  .strict();

export const missionReplanSchema = z
  .object({
    objective: z.string().trim().min(3).max(4000).optional(),
    addedDomains: z.array(mapAbleModuleSchema).max(8).optional(),
    removedDomains: z.array(mapAbleModuleSchema).max(8).optional(),
    rejectedRecommendationIds: z.array(z.string().max(80)).max(20).optional(),
    requestedUseOfAccessibilityProfile: z.boolean().optional(),
    profileConsentGranted: z.boolean().optional(),
    selectNonAiPath: z.boolean().optional(),
  })
  .strict();

export const missionGraphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(MISSION_NODE_TYPES),
  label: z.string(),
  status: z.enum(MISSION_NODE_STATUSES),
  sourceDomain: mapAbleModuleSchema,
  recordId: z.string().nullable(),
  details: z.string(),
  evidenceRefs: z.array(z.string()),
  confidence: z.number().nullable(),
  limitations: z.array(z.string()),
});

export const missionPlanStatusSchema = z.enum(MISSION_PLAN_STATUSES);

export const missionActionProposalSchema = z.object({
  id: z.string(),
  action: z.enum(MISSION_ACTION_TYPES),
  payload: z.record(z.string(), z.unknown()),
  informationToShare: z.array(z.string()),
  purpose: z.string(),
  estimatedCost: z.string().nullable(),
  unknownCosts: z.boolean(),
  cancellationTerms: z.string().nullable(),
  requiredConsent: z.array(z.string()),
  requiredApprovals: z.array(z.enum(["participant", "human", "coordinator"])),
  payloadHash: z.string(),
  expiryIso: z.string(),
  status: z.literal("proposed"),
});
