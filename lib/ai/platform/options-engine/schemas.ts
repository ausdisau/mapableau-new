import { z } from "zod";
import { EVIDENCE_STATES, HARD_CONSTRAINT_KINDS, OPTIONS_DOMAINS, RANKING_DIMENSIONS, VERIFICATION_STATES } from "./types";

export const optionsDomainSchema = z.enum(OPTIONS_DOMAINS);
export const hardConstraintKindSchema = z.enum(HARD_CONSTRAINT_KINDS);
export const rankingDimensionSchema = z.enum(RANKING_DIMENSIONS);
export const evidenceStateSchema = z.enum(EVIDENCE_STATES);
export const verificationStateSchema = z.enum(VERIFICATION_STATES);

export const hardConstraintSchema = z.object({
  kind: hardConstraintKindSchema, label: z.string().min(1).max(200), value: z.string().min(1).max(500), required: z.boolean(),
}).strict();

export const evidenceItemSchema = z.object({
  id: z.string().min(1).max(120), label: z.string().min(1).max(300), state: evidenceStateSchema,
  source: z.string().max(200).optional(), freshnessLabel: z.string().max(120).optional(), notes: z.string().max(500).optional(),
}).strict();

export const optionCandidateSchema = z.object({
  id: z.string().min(1).max(120), domain: optionsDomainSchema, tenantId: z.string().min(1).max(120),
  displayName: z.string().min(1).max(300), providerLabel: z.string().min(1).max(300),
  features: z.array(z.string().max(200)).max(100).default([]),
  credentials: z.array(z.string().max(200)).max(50).default([]),
  serviceAreas: z.array(z.string().max(120)).max(50).default([]),
  availabilityWindows: z.array(z.string().max(120)).max(50).default([]),
  exclusions: z.array(z.string().max(200)).max(50).default([]),
  evidence: z.array(evidenceItemSchema).max(50).default([]),
  verificationState: verificationStateSchema,
  distanceKm: z.number().nonnegative().nullable(), knownCostAud: z.number().nonnegative().nullable(),
  continuityScore: z.number().min(0).max(1).nullable(),
  preferenceTags: z.array(z.string().max(120)).max(50).default([]),
  disclosureRequired: z.boolean().optional(),
  vehicleSuitability: z.object({ wheelchairAccessible: z.boolean(), hoistAvailable: z.boolean(), verified: z.boolean() }).optional(),
  accessProfile: z.object({ claimedAccessible: z.boolean(), barrierAbsenceOnly: z.boolean(), source: z.string().max(200).optional(), freshnessLabel: z.string().max(120).optional() }).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export const rankingPrioritiesSchema = z.object({
  access_fit: z.number().min(0).max(1), time_fit: z.number().min(0).max(1), availability: z.number().min(0).max(1),
  participant_preference: z.number().min(0).max(1), distance: z.number().min(0).max(1), continuity: z.number().min(0).max(1),
  known_cost: z.number().min(0).max(1), evidence_quality: z.number().min(0).max(1),
}).strict().partial();

export const optionsRequestSchema = z.object({
  sessionId: z.string().min(1).max(120).optional(), tenantId: z.string().min(1).max(120),
  participantId: z.string().min(1).max(120), actorId: z.string().min(1).max(120), domain: optionsDomainSchema,
  missionId: z.string().min(1).max(120).optional(), traceId: z.string().min(1).max(120).optional(),
  requirements: z.array(hardConstraintSchema).max(50), rankingPriorities: rankingPrioritiesSchema.optional(),
  exclusions: z.array(z.string().max(200)).max(100).optional(),
  functionalRequirementsAuthorised: z.boolean().optional(), disclosureConsentGranted: z.boolean().optional(),
  consentScopes: z.array(z.string().max(120)).max(30).optional(),
  candidates: z.array(optionCandidateSchema).max(200), requestModelExplanation: z.boolean().optional(),
}).strict();

export const chooseOptionInputSchema = z.object({
  sessionId: z.string().min(1).max(120), optionId: z.string().min(1).max(120),
  participantId: z.string().min(1).max(120), tenantId: z.string().min(1).max(120),
  prepareActionProposal: z.boolean().optional(), missionId: z.string().min(1).max(120).optional(),
  consentScopes: z.array(z.string().max(120)).max(30).optional(),
}).strict();

export const reRankInputSchema = z.object({
  sessionId: z.string().min(1).max(120), participantId: z.string().min(1).max(120),
  tenantId: z.string().min(1).max(120), rankingPriorities: rankingPrioritiesSchema,
}).strict();
