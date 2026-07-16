import { z } from "zod";

import { careRequestTypeSchema } from "@/lib/validation/care";

const riskSignalSchema = z.enum([
  "manual_handling",
  "medication_prompting",
  "behaviour_support",
  "safeguarding",
  "clinical_diagnosis_language",
  "ndis_eligibility_language",
]);

export const careIntakeLlmSchema = z.object({
  inferredRequestType: careRequestTypeSchema,
  titleHint: z.string().min(3).max(120),
  schedulingHints: z
    .object({
      preferredDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      locationHint: z.string().optional(),
    })
    .default({}),
  riskSignals: z.array(riskSignalSchema).default([]),
  linkedTransportRequired: z.boolean().default(false),
  accessNotesCandidate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const careTaskLlmSchema = z.object({
  tasks: z
    .array(
      z.object({
        name: z.string().min(2).max(200),
        intensity: z.enum(["standard", "high"]),
      }),
    )
    .min(1)
    .max(8),
  confidence: z.number().min(0).max(1),
});

export const careCapabilityLlmSchema = z.object({
  capabilityIds: z.array(z.string().min(1)).max(12),
  confidence: z.number().min(0).max(1),
});

export const careExplainerLlmSchema = z.object({
  summary: z.string().min(40).max(2000),
  confidence: z.number().min(0).max(1),
});

export type CareIntakeLlmOutput = z.infer<typeof careIntakeLlmSchema>;
export type CareTaskLlmOutput = z.infer<typeof careTaskLlmSchema>;
export type CareCapabilityLlmOutput = z.infer<typeof careCapabilityLlmSchema>;
export type CareExplainerLlmOutput = z.infer<typeof careExplainerLlmSchema>;

/** Capability ids the LLM may suggest (rules always add mandatory ones). */
export const LLM_ALLOWED_CAPABILITY_IDS = [
  "manual_handling_awareness",
  "medication_prompting_supervision",
  "behaviour_support",
  "safeguarding_review",
  "high_intensity_competency",
  "personal_care_scope",
  "care_transport_coordination",
] as const;
