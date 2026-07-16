import { google } from "@ai-sdk/google";
import { Output, ToolLoopAgent, stepCountIs, gateway } from "ai";

import { auraFlags } from "../feature-flags";
import { AURA_SYSTEM_INSTRUCTIONS } from "../instructions";
import { auraResponseSchema } from "../schemas";
import { createAuraTools, type AuraToolContext } from "../tools";

function stripGooglePrefix(id: string): string {
  return id.startsWith("google/") ? id.slice("google/".length) : id;
}

function getAuraModel() {
  const modelId =
    process.env.ACCESS_INTELLIGENCE_MODEL ||
    process.env.MAPABLE_AURA_MODEL ||
    "google/gemini-2.0-flash";
  if (process.env.AI_GATEWAY_API_KEY) {
    return gateway(modelId);
  }
  return google(stripGooglePrefix(modelId));
}

/**
 * Optional LLM agent — Wave 1 prefers deterministic planner.
 * Tools never receive Prisma.
 */
export function createAuraAgent(ctx: AuraToolContext) {
  if (!auraFlags.modelReasoning) {
    throw new Error("MAPABLE_AURA_MODEL_REASONING_DISABLED");
  }

  return new ToolLoopAgent({
    model: getAuraModel(),
    instructions: AURA_SYSTEM_INSTRUCTIONS,
    tools: createAuraTools(ctx),
    stopWhen: stepCountIs(8),
    output: Output.object({
      schema: auraResponseSchema,
      name: "AuraResponse",
      description:
        "Structured AURA response grounded in deterministic tools — not free-form speculation.",
    }),
  });
}

export type AuraAgent = ReturnType<typeof createAuraAgent>;
