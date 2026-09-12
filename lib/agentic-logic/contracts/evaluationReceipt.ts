import { z } from "zod";

export const AuthorityState = z.enum([
  "advisory",
  "human_review_required",
  "approved",
  "not_authorised",
]);

export type AuthorityState = z.infer<typeof AuthorityState>;

export const ConclusionSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  score: z.number().optional(),
  authority: AuthorityState,
  requiresHumanReview: z.boolean().optional(),
  supportingFacts: z.array(z.string()).optional(),
  contradictingFacts: z.array(z.string()).optional(),
  rulesUsed: z.array(z.string()).optional(),
});

export const EvaluationReceiptSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  context: z.object({
    participantId: z.string().optional(),
    missionId: z.string().optional(),
    purpose: z.string().optional(),
  }),
  timestamp: z.string(),
  conclusions: z.array(ConclusionSchema),
  provenance: z.array(z.string()).optional(),
});

export type EvaluationReceipt = z.infer<typeof EvaluationReceiptSchema>;
