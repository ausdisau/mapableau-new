import { z } from "zod";

export const consciousnessTheoryFamilySchema = z.enum([
  "global_workspace",
  "higher_order",
  "recurrent_processing",
  "predictive_processing",
  "attention_schema",
  "integrated_information",
  "biological_substrate",
  "other",
]);

export const computationalApplicabilitySchema = z.enum([
  "supports",
  "contested",
  "opposes",
  "unknown",
]);

export const consciousnessTheorySchema = z.object({
  id: z.string(),
  name: z.string(),
  theoryFamily: consciousnessTheoryFamilySchema,
  summary: z.string(),
  computationalApplicability: computationalApplicabilitySchema,
  sourceIds: z.array(z.string()),
  version: z.number().int().positive(),
});

export type ConsciousnessTheory = z.infer<typeof consciousnessTheorySchema>;

export const consciousnessIndicatorSchema = z.object({
  id: z.string(),
  theoryIds: z.array(z.string()),
  name: z.string(),
  operationalDefinition: z.string(),
  evidenceRequired: z.array(z.string()),
  knownConfounds: z.array(z.string()),
  status: z.enum(["active", "contested", "retired"]),
  version: z.number().int().positive(),
});

export type ConsciousnessIndicator = z.infer<
  typeof consciousnessIndicatorSchema
>;

export const consciousnessEvidenceSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  indicatorIds: z.array(z.string()),
  direction: z.enum(["supports", "opposes", "uncertain"]),
  publicationStatus: z.enum([
    "peer_reviewed",
    "preprint",
    "review",
    "commentary",
    "other",
  ]),
  methodSummary: z.string(),
  alternativeExplanations: z.array(z.string()),
  replicationStatus: z.enum([
    "replicated",
    "partially_replicated",
    "not_replicated",
    "unknown",
  ]),
  evidenceStrength: z.enum(["low", "moderate", "strong"]),
  assessedAt: z.string().datetime(),
});

export type ConsciousnessEvidence = z.infer<
  typeof consciousnessEvidenceSchema
>;

export const systemIndicatorAssessmentSchema = z.object({
  systemId: z.string(),
  systemVersion: z.string(),
  indicatorId: z.string(),
  architectureEvidenceIds: z.array(z.string()),
  experimentEvidenceIds: z.array(z.string()),
  observedStatus: z.enum(["present", "partial", "absent", "unknown"]),
  mimicryRisk: z.enum(["low", "medium", "high", "unknown"]),
  confidence: z.enum(["low", "medium", "high"]),
  limitations: z.array(z.string()),
});

export type SystemIndicatorAssessment = z.infer<
  typeof systemIndicatorAssessmentSchema
>;

export const consciousnessResearchAssessmentSchema = z.object({
  id: z.string(),
  systemId: z.string(),
  systemVersion: z.string(),
  theoryCoverage: z.array(z.string()),
  positiveIndicatorIds: z.array(z.string()),
  negativeIndicatorIds: z.array(z.string()),
  uncertainIndicatorIds: z.array(z.string()),
  functionalSelfModelEvidence: z.array(z.string()),
  metacognitionEvidence: z.array(z.string()),
  introspectionEvidence: z.array(z.string()),
  agencyEvidence: z.array(z.string()),
  embodimentEvidence: z.array(z.string()),
  phenomenalConsciousnessEvidence: z.array(z.string()),
  supportingSourceIds: z.array(z.string()),
  counterSourceIds: z.array(z.string()),
  overallUncertainty: z.enum(["very_high", "high", "material", "low"]),
  personhoodReviewRecommended: z.boolean(),
  rationale: z.string(),
});

export type ConsciousnessResearchAssessment = z.infer<
  typeof consciousnessResearchAssessmentSchema
>;

export const humanAttributionAssessmentSchema = z.object({
  systemId: z.string(),
  systemVersion: z.string(),
  anthropomorphicCues: z.array(z.string()),
  dependencyRisks: z.array(z.string()),
  misleadingSelfPresentationRisks: z.array(z.string()),
  relationalSafetyControls: z.array(z.string()),
  humanReviewRequired: z.boolean(),
});

export type HumanAttributionAssessment = z.infer<
  typeof humanAttributionAssessmentSchema
>;

export const precautionLevelSchema = z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]);

export const personhoodEscalationOutcomeSchema = z.enum([
  "NO_ESCALATION",
  "RESEARCH_PRECAUTION",
  "PERSONHOOD_REVIEW_REQUIRED",
  "HUMAN_REVIEW_REQUIRED",
]);

export const personhoodEscalationRecommendationSchema = z.object({
  outcome: personhoodEscalationOutcomeSchema,
  recommendedPrecautionLevel: precautionLevelSchema,
  reasons: z.array(z.string()),
  requiresHumanGovernanceConfirmation: z.literal(true),
});

export type PersonhoodEscalationRecommendation = z.infer<
  typeof personhoodEscalationRecommendationSchema
>;
