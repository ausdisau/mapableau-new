import { z } from "zod";

export const deliberateScenarioSchema = z
  .object({ scenarioId: z.string().min(1).max(100) })
  .strict();
