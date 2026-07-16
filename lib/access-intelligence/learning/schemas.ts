import { z } from "zod";

export const learningModeSchema = z.enum(["plan", "guide_me", "practice", "facilitate"]);

export const learningStageSchema = z.enum([
  "orientation",
  "prediction",
  "investigation",
  "decision",
  "consequence",
  "revision",
  "teach_back",
  "reflection",
  "transfer",
  "complete",
]);

export const masteryLevelSchema = z.enum([
  "introduced",
  "developing",
  "independent",
  "can_explain_to_others",
]);

export const hintLevelSchema = z.enum(["prompt", "point_evidence", "explanation"]);

export const rubricDimensionSchema = z.enum([
  "requirement_recognition",
  "evidence_reasoning",
  "uncertainty_handling",
  "route_and_contingency",
  "consent_rights_privacy_communication",
]);

export const learningPreferencesSchema = z.object({
  userId: z.string(),
  preferredMode: learningModeSchema.default("plan"),
  plainLanguage: z.boolean().default(true),
  requirePredictionBeforeEvidence: z.boolean().default(true),
  hintsEnabled: z.boolean().default(true),
  reducedMotion: z.boolean().default(false),
  textOnlyMaps: z.boolean().default(true),
  updatedAt: z.string(),
});

export const learningObjectiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  concepts: z.array(z.string()),
  audience: z.array(z.string()),
  jurisdiction: z.string().default("AU"),
});

export const scenarioStageSchema = z.object({
  id: z.string(),
  stage: learningStageSchema,
  title: z.string(),
  prompt: z.string(),
  evidenceIdsVisible: z.array(z.string()).default([]),
  allowHints: z.boolean().default(true),
});

export const decisionPointSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      predictedStatus: z.enum([
        "suitable",
        "suitable_with_conditions",
        "blocked",
        "unknown",
      ]),
    }),
  ),
  expectedOptionId: z.string(),
  rationale: z.string(),
});

export const dynamicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  introducesIncidentId: z.string().optional(),
  triggerAfterStage: learningStageSchema,
});

export const rubricCriterionSchema = z.object({
  id: z.string(),
  dimension: rubricDimensionSchema,
  description: z.string(),
  expectedBehaviours: z.array(z.string()),
  weight: z.number().positive().default(1),
});

export const learningScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  humanGoal: z.string(),
  placeId: z.string(),
  destination: z.string(),
  passportId: z.string(),
  objectiveIds: z.array(z.string()),
  audience: z.array(z.string()),
  stages: z.array(scenarioStageSchema),
  decisionPoints: z.array(decisionPointSchema),
  dynamicEvents: z.array(dynamicEventSchema).default([]),
  evidenceIds: z.array(z.string()),
  unknownHighlights: z.array(z.string()),
  expectedReasoning: z.array(z.string()),
  formativeFeedback: z.record(z.string(), z.string()),
  teachBackPrompt: z.string(),
  teachBackKeywords: z.array(z.string()),
  reflectionPrompts: z.array(z.string()),
  transferTask: z.object({
    title: z.string(),
    instructions: z.string(),
    successCriteria: z.array(z.string()),
  }),
  rubric: z.array(rubricCriterionSchema),
  published: z.boolean().default(true),
  version: z.string(),
  author: z.string(),
  accessibilityReviewer: z.string().optional(),
  livedExperienceReviewer: z.string().optional(),
  professionalReviewer: z.string().optional(),
  jurisdiction: z.string().default("AU"),
  reviewDate: z.string().optional(),
  sourceMaterial: z.array(z.string()).default([]),
});

export const learnerResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  stage: learningStageSchema,
  kind: z.enum([
    "prediction",
    "decision",
    "revision",
    "teach_back",
    "reflection",
    "transfer",
    "hint_request",
  ]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const rubricEvaluationSchema = z.object({
  sessionId: z.string(),
  scenarioId: z.string(),
  dimensionScores: z.record(rubricDimensionSchema, z.number()),
  overallPercent: z.number(),
  feedback: z.array(z.string()),
  passed: z.boolean(),
  evaluatedAt: z.string(),
});

export const masteryRecordSchema = z.object({
  userId: z.string(),
  conceptId: z.string(),
  level: masteryLevelSchema,
  evidenceNotes: z.array(z.string()).default([]),
  updatedAt: z.string(),
});

export const facilitatedSessionSchema = z.object({
  id: z.string(),
  facilitatorUserId: z.string(),
  scenarioId: z.string(),
  mode: z.literal("facilitate"),
  participantIds: z.array(z.string()).default([]),
  anonymousResponses: z.boolean().default(true),
  pausedAtStage: learningStageSchema.nullable(),
  revealedStageIds: z.array(z.string()).default([]),
  responses: z.array(learnerResponseSchema).default([]),
  debriefNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const fieldMissionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  instructions: z.string(),
  relatedScenarioId: z.string().optional(),
  dueAt: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
  createdAt: z.string(),
});

export const contentReviewSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  reviewType: z.enum([
    "accessibility",
    "lived_experience",
    "professional",
    "editorial",
  ]),
  reviewerName: z.string(),
  status: z.enum(["requested", "approved", "changes_requested"]),
  notes: z.string().optional(),
  reviewedAt: z.string().optional(),
});

export const practiceSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  scenarioId: z.string(),
  mode: learningModeSchema,
  stage: learningStageSchema,
  hintLevel: z.number().int().min(0).max(3).default(0),
  predictionOptionId: z.string().nullable().default(null),
  decisionOptionId: z.string().nullable().default(null),
  revisionOptionId: z.string().nullable().default(null),
  confidencePrediction: z.number().min(0).max(100).nullable().default(null),
  evidenceRevealed: z.boolean().default(false),
  eventTriggered: z.boolean().default(false),
  teachBackText: z.string().nullable().default(null),
  reflections: z.array(z.string()).default([]),
  transferComplete: z.boolean().default(false),
  responses: z.array(learnerResponseSchema).default([]),
  rubricEvaluation: rubricEvaluationSchema.nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LearningMode = z.infer<typeof learningModeSchema>;
export type LearningStage = z.infer<typeof learningStageSchema>;
export type MasteryLevel = z.infer<typeof masteryLevelSchema>;
export type HintLevel = z.infer<typeof hintLevelSchema>;
export type RubricDimension = z.infer<typeof rubricDimensionSchema>;
export type LearningPreferences = z.infer<typeof learningPreferencesSchema>;
export type LearningObjective = z.infer<typeof learningObjectiveSchema>;
export type ScenarioStage = z.infer<typeof scenarioStageSchema>;
export type DecisionPoint = z.infer<typeof decisionPointSchema>;
export type DynamicEvent = z.infer<typeof dynamicEventSchema>;
export type LearnerResponse = z.infer<typeof learnerResponseSchema>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export type RubricEvaluation = z.infer<typeof rubricEvaluationSchema>;
export type MasteryRecord = z.infer<typeof masteryRecordSchema>;
export type FacilitatedSession = z.infer<typeof facilitatedSessionSchema>;
export type FieldMission = z.infer<typeof fieldMissionSchema>;
export type ContentReview = z.infer<typeof contentReviewSchema>;
export type LearningScenario = z.infer<typeof learningScenarioSchema>;
export type PracticeSession = z.infer<typeof practiceSessionSchema>;
