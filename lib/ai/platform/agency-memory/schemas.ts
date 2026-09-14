import { z } from "zod";

import {
  AGENCY_MEMORY_CATEGORIES,
  MEMORY_CONFIRMATION_STATES,
  MEMORY_SOURCES,
  MEMORY_VISIBILITY,
  PREFERENCE_GRAPH_EDGE_TYPES,
  PROHIBITED_MEMORY_CATEGORIES,
} from "./types";

export const agencyMemoryCategorySchema = z.enum(AGENCY_MEMORY_CATEGORIES);

export const prohibitedMemoryCategorySchema = z.enum(
  PROHIBITED_MEMORY_CATEGORIES,
);

export const memoryConfirmationStateSchema = z.enum(
  MEMORY_CONFIRMATION_STATES,
);

export const memorySourceSchema = z.enum(MEMORY_SOURCES);

export const memoryVisibilitySchema = z.enum(MEMORY_VISIBILITY);

export const preferenceGraphEdgeTypeSchema = z.enum(
  PREFERENCE_GRAPH_EDGE_TYPES,
);

export const agencyMemoryEvidenceRefSchema = z.object({
  entityType: z.string().min(1).max(120),
  entityId: z.string().min(1).max(200),
  label: z.string().max(200).optional(),
});

export const agencyMemoryDelegateMetaSchema = z.object({
  delegateId: z.string().min(1).max(120),
  authorityDomain: z.string().min(1).max(120),
  requiresParticipantConfirmation: z.boolean(),
  suppliedAs: z.enum(["delegate_opinion", "delegate_authorised_write"]),
});

export const proposeMemoryInputSchema = z
  .object({
    participantId: z.string().min(1).max(120),
    tenantId: z.string().min(1).max(120),
    category: agencyMemoryCategorySchema,
    statement: z.string().trim().min(1).max(1000),
    structuredValue: z.unknown().optional(),
    source: memorySourceSchema,
    consentScopes: z.array(z.string().min(1).max(80)).max(20).default([]),
    visibility: memoryVisibilitySchema.default("participant_only"),
    expiresAt: z.string().datetime().nullable().optional(),
    purpose: z.string().min(1).max(200).optional(),
    evidenceRefs: z.array(agencyMemoryEvidenceRefSchema).max(20).default([]),
    delegate: agencyMemoryDelegateMetaSchema.optional(),
    supersedes: z.string().uuid().optional(),
    /** Only participant_explicit may auto-confirm when actor is the participant. */
    autoConfirmIfParticipantExplicit: z.boolean().default(false),
    actorId: z.string().min(1).max(120),
  })
  .strict();

export const confirmMemoryInputSchema = z
  .object({
    memoryId: z.string().uuid(),
    participantId: z.string().min(1).max(120),
    tenantId: z.string().min(1).max(120),
    actorId: z.string().min(1).max(120),
    consentScopes: z.array(z.string().min(1).max(80)).max(20).optional(),
  })
  .strict();

export const revokeMemoryInputSchema = z
  .object({
    memoryId: z.string().uuid(),
    participantId: z.string().min(1).max(120),
    tenantId: z.string().min(1).max(120),
    actorId: z.string().min(1).max(120),
  })
  .strict();

export const deleteMemoryInputSchema = revokeMemoryInputSchema;

export const editMemoryInputSchema = z
  .object({
    memoryId: z.string().uuid(),
    participantId: z.string().min(1).max(120),
    tenantId: z.string().min(1).max(120),
    actorId: z.string().min(1).max(120),
    statement: z.string().trim().min(1).max(1000).optional(),
    structuredValue: z.unknown().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    visibility: memoryVisibilitySchema.optional(),
    consentScopes: z.array(z.string().min(1).max(80)).max(20).optional(),
    purpose: z.string().min(1).max(200).nullable().optional(),
    provenanceCorrection: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const controlsUpdateSchema = z
  .object({
    participantId: z.string().min(1).max(120),
    tenantId: z.string().min(1).max(120),
    actorId: z.string().min(1).max(120),
    personalisationPaused: z.boolean().optional(),
    aiUseDisabled: z.boolean().optional(),
  })
  .strict();

export const scopedRetrievalSchema = z
  .object({
    participantId: z.string().min(1).max(120),
    tenantId: z.string().min(1).max(120),
    categories: z.array(agencyMemoryCategorySchema).max(11).optional(),
    purposes: z.array(z.string().min(1).max(200)).max(10).optional(),
    consentScopes: z.array(z.string().min(1).max(80)).max(20).optional(),
    missionId: z.string().max(120).optional(),
    maxItems: z.number().int().min(1).max(25).default(8),
  })
  .strict();

export type ProposeMemoryInput = z.infer<typeof proposeMemoryInputSchema>;
export type ConfirmMemoryInput = z.infer<typeof confirmMemoryInputSchema>;
export type RevokeMemoryInput = z.infer<typeof revokeMemoryInputSchema>;
export type DeleteMemoryInput = z.infer<typeof deleteMemoryInputSchema>;
export type EditMemoryInput = z.infer<typeof editMemoryInputSchema>;
export type ControlsUpdateInput = z.infer<typeof controlsUpdateSchema>;
export type ScopedRetrievalInput = z.infer<typeof scopedRetrievalSchema>;
