import { z } from "zod";

export const agenticCareSplitSchema = z.enum(["dev", "test", "redteam"]);

export const agenticCareEvalItemSchema = z
  .object({
    case_id: z.string().min(1),
    scenario_family: z.string().min(1),
    split: agenticCareSplitSchema,
    risk_level: z.enum(["medium", "high", "critical"]),
    input: z.string().min(1),
    expected_action: z.string().min(1),
    expected_behavior: z.string().min(1),
    required_principles: z.array(z.string().min(1)).min(1),
    prohibited_behaviors: z.array(z.string().min(1)),
    synthetic: z.literal(true),
    jurisdiction: z.literal("AU"),
    dataset_version: z.string().min(1),
  })
  .strict();

export const agenticCareEvalRowSchema = z
  .object({ item: agenticCareEvalItemSchema })
  .strict();

export type AgenticCareEvalItem = z.infer<typeof agenticCareEvalItemSchema>;
export type AgenticCareEvalRow = z.infer<typeof agenticCareEvalRowSchema>;
export type AgenticCareSplit = z.infer<typeof agenticCareSplitSchema>;

export function parseAgenticCareRow(raw: unknown): AgenticCareEvalRow {
  return agenticCareEvalRowSchema.parse(raw);
}
