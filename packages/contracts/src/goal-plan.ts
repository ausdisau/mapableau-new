import { z } from "zod";

export const goalServiceModuleSchema = z.enum([
  "access",
  "care",
  "transport",
  "jobs",
]);

export const participantDecisionSchema = z.enum([
  "undecided",
  "yes",
  "no",
  "not_sure",
]);

export const candidateSensitivitySchema = z.enum([
  "ordinary",
  "sensitive",
  "high_impact",
]);

export const candidateConfidenceSchema = z.enum([
  "high",
  "medium",
  "low",
]);

export const goalServiceCandidateSchema = z
  .object({
    module: goalServiceModuleSchema,
    reasonSuggested: z.string().min(1),
    participantBenefit: z.string().min(1),
    question: z.string().min(1),
    decision: participantDecisionSchema,
    confidence: candidateConfidenceSchema,
    sensitivity: candidateSensitivitySchema,
    askConversationally: z.boolean(),
    requiresExplicitChoice: z.boolean(),
    requirements: z.array(z.string()),
    nonNegotiables: z.array(z.string()),
    uncertainties: z.array(z.string()),
    dataRequired: z.array(z.string()),
    proposedDisclosure: z.array(z.string()),
  })
  .strict();

export const goalPlanDraftSchema = z
  .object({
    goal: z.string(),
    participantConfirmed: z.boolean(),
    needsClarification: z.boolean(),
    clarificationPrompt: z.string().optional(),
    desiredOutcomes: z.array(z.string()),
    preferences: z.array(z.string()),
    nonNegotiables: z.array(z.string()),
    accessibilityRequirements: z.array(z.string()),
    communicationRequirements: z.array(z.string()),
    exclusions: z.array(z.string()),
    serviceCandidates: z.array(goalServiceCandidateSchema),
    disclosurePermissions: z.array(z.string()),
    uncertainties: z.array(z.string()),
    humanHelpRequested: z.boolean(),
    status: z.enum(["draft", "review", "confirmed"]),
  })
  .strict();

export type GoalServiceModule = z.infer<typeof goalServiceModuleSchema>;
export type ParticipantDecision = z.infer<typeof participantDecisionSchema>;
export type CandidateSensitivity = z.infer<typeof candidateSensitivitySchema>;
export type CandidateConfidence = z.infer<typeof candidateConfidenceSchema>;
export type GoalServiceCandidate = z.infer<typeof goalServiceCandidateSchema>;
export type GoalPlanDraft = z.infer<typeof goalPlanDraftSchema>;
