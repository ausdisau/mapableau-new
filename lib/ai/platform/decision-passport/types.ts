import { z } from "zod";

export const decisionPassportSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().nullable().optional(),
  participantId: z.string().min(1),
  capabilityKey: z.string().min(1),
  requestedSummary: z.string().min(1),
  preferencesUsed: z.array(z.string()),
  constraintsUsed: z.array(z.string()),
  sourcesConsulted: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      kind: z.string(),
    }),
  ),
  missingOrStaleInformation: z.array(z.string()),
  suggestedProviders: z.array(
    z.object({
      sourceId: z.string(),
      name: z.string(),
      reasons: z.array(z.string()),
      score: z.number(),
    }),
  ),
  uncertaintyAndLimitations: z.array(z.string()),
  aiInvolvement: z.object({
    used: z.boolean(),
    modelVersion: z.string().nullable().optional(),
    promptVersion: z.string().nullable().optional(),
    commentaryOptional: z.boolean(),
  }),
  proposedNextAction: z.object({
    actionType: z.string(),
    envelopeId: z.string().nullable().optional(),
    summary: z.string(),
  }),
  requiredApproverRole: z.string(),
  controls: z.object({
    canCorrectFacts: z.literal(true),
    canEditRankingWeights: z.literal(true),
    canEditHardConstraints: z.literal(true),
    canRejectSuggestion: z.literal(true),
    canRequestAnotherOption: z.literal(true),
    canWithdrawConsent: z.literal(true),
    canRequestHumanReview: z.literal(true),
    canContinueNonAi: z.literal(true),
    nonAiPath: z.string(),
  }),
  createdAt: z.string().datetime(),
});

export type DecisionPassport = z.infer<typeof decisionPassportSchema>;
