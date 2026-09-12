import { z } from "zod";

export const FactState = z.enum([
  "confirmed",
  "reported",
  "inferred",
  "unknown",
  "disputed",
  "stale",
  "superseded",
]);

export type FactState = z.infer<typeof FactState>;

export const FactScope = z.object({
  missionId: z.string().uuid().optional(),
  caseId: z.string().uuid().optional(),
  workflowId: z.string().optional(),
});

export const ConsentTag = z.object({
  granted: z.boolean(),
  purpose: z.string().optional(),
});

export const FactSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  subject: z.string(),
  predicate: z.string(),
  object: z.any(),
  source: z.string().optional(),
  timestamp: z.string().optional(),
  state: FactState,
  scope: FactScope.optional(),
  consent: ConsentTag.optional(),
  provenance: z.array(z.string()).optional(),
});

export type Fact = z.infer<typeof FactSchema>;
