import { z } from "zod";

export const RuleType = z.enum([
  "hard_constraint",
  "weighted_rule",
  "defeasible_default",
  "evidence_requirement",
  "authority_rule",
  "contradiction_rule",
]);

export type RuleType = z.infer<typeof RuleType>;

export const BaseRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: RuleType,
  description: z.string().optional(),
  author: z.string().optional(),
  createdAt: z.string().optional(),
});

export const WeightedRuleSchema = BaseRuleSchema.extend({
  type: z.literal("weighted_rule"),
  weight: z.number(),
  formula: z.string(), // structured expression or DSL reference (parser lives elsewhere)
});

export const HardConstraintSchema = BaseRuleSchema.extend({
  type: z.literal("hard_constraint"),
  formula: z.string(),
});

export const RuleSchema = z.union([WeightedRuleSchema, HardConstraintSchema, BaseRuleSchema]);

export type Rule = z.infer<typeof RuleSchema>;
