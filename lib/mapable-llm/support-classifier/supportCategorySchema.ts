import { z } from "zod";

/** Supported MapAble support category codes (non-exhaustive taxonomy). */
export const SUPPORT_CATEGORY_CODES = [
  "personal_care",
  "accessible_transport",
  "employment_support",
  "sensory_access_need",
  "community_participation",
  "housing_tenancy",
  "assistive_technology",
  "plan_management",
  "unclear",
] as const;

export type SupportCategoryCode = (typeof SUPPORT_CATEGORY_CODES)[number];

export const GUARDRAIL_FLAG_CODES = [
  "not_a_diagnosis",
  "not_ndis_eligibility_decision",
  "not_final_service_recommendation",
  "insufficient_detail",
  "may_need_human_review",
  "possible_safety_concern",
] as const;

export type GuardrailFlagCode = (typeof GUARDRAIL_FLAG_CODES)[number];

export const SUPPORT_CLASSIFIER_PROMPT_VERSION = "support-classifier-v1";

const categoryItemSchema = z.object({
  code: z.enum(SUPPORT_CATEGORY_CODES),
  label: z.string().min(1).max(120),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(800),
});

export const supportClassificationResultSchema = z.object({
  categories: z.array(categoryItemSchema).max(8),
  missingInformation: z.array(z.string().max(300)).max(12),
  guardrailFlags: z.array(z.enum(GUARDRAIL_FLAG_CODES)).max(12),
  participantSummary: z.string().min(1).max(1200),
  overallConfidence: z.number().min(0).max(1),
});

export type SupportClassificationResult = z.infer<
  typeof supportClassificationResultSchema
>;

export type SupportClassificationAuditMetadata = {
  requestId: string;
  classifiedAt: string;
  model: string;
  promptVersion: string;
  inputCharacterCount: number;
  inputHash: string;
  openaiResponseId?: string;
};

export type SupportClassificationResponse = {
  classification: SupportClassificationResult;
  audit: SupportClassificationAuditMetadata;
};

/**
 * JSON Schema for OpenAI Responses API strict structured output.
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */
export const supportClassificationJsonSchema = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: {
            type: "string",
            enum: [...SUPPORT_CATEGORY_CODES],
          },
          label: { type: "string" },
          confidence: { type: "number" },
          reasoning: { type: "string" },
        },
        required: ["code", "label", "confidence", "reasoning"],
        additionalProperties: false,
      },
    },
    missingInformation: {
      type: "array",
      items: { type: "string" },
    },
    guardrailFlags: {
      type: "array",
      items: {
        type: "string",
        enum: [...GUARDRAIL_FLAG_CODES],
      },
    },
    participantSummary: { type: "string" },
    overallConfidence: { type: "number" },
  },
  required: [
    "categories",
    "missingInformation",
    "guardrailFlags",
    "participantSummary",
    "overallConfidence",
  ],
  additionalProperties: false,
} as const;

export function parseSupportClassificationResult(
  raw: unknown
): SupportClassificationResult {
  return supportClassificationResultSchema.parse(raw);
}

/** Post-parse safety checks beyond Zod shape validation. */
export function applyLocalGuardrailChecks(
  result: SupportClassificationResult
): SupportClassificationResult {
  const flags = new Set(result.guardrailFlags);

  flags.add("not_a_diagnosis");
  flags.add("not_ndis_eligibility_decision");
  flags.add("not_final_service_recommendation");

  const diagnosticPattern =
    /\b(diagnos(e|is|ed)|autism spectrum disorder|ASD\b|ADHD\b|mental illness|you have|you are)\b/i;
  if (
    diagnosticPattern.test(result.participantSummary) ||
    result.categories.some((c) => diagnosticPattern.test(c.reasoning))
  ) {
    flags.add("may_need_human_review");
  }

  const eligibilityPattern =
    /\b(ndis eligible|plan.?managed|funding guaranteed|you qualify)\b/i;
  if (
    eligibilityPattern.test(result.participantSummary) ||
    result.categories.some((c) => eligibilityPattern.test(c.reasoning))
  ) {
    flags.add("may_need_human_review");
  }

  if (result.categories.length === 0 || result.overallConfidence < 0.35) {
    flags.add("insufficient_detail");
  }

  return {
    ...result,
    guardrailFlags: [...flags],
  };
}
