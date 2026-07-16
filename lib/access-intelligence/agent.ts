import { google } from "@ai-sdk/google";
import { Output, ToolLoopAgent, stepCountIs , gateway } from "ai";

import {
  accessIntelligenceConfig,
  isAccessIntelligenceAiConfigured,
} from "./configuration";
import { AccessIntelligenceError } from "./errors";
import { ACCESS_INTELLIGENCE_INSTRUCTIONS } from "./instructions";
import { createLearningTools } from "./learning/tools";
import { agentAccessPlanSchema } from "./schemas";
import { createAccessIntelligenceTools } from "./tools";
import type { ServerAccessContext } from "./types";

function stripGooglePrefix(id: string): string {
  return id.startsWith("google/") ? id.slice("google/".length) : id;
}

export function getAccessIntelligenceModel() {
  if (!isAccessIntelligenceAiConfigured()) {
    throw new AccessIntelligenceError(
      "AI_PROVIDER_UNAVAILABLE",
      "The AI provider is not configured.",
      "Set AI_GATEWAY_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY, or continue using passport and demo engines without chat.",
    );
  }

  const modelId = accessIntelligenceConfig.modelId;
  if (accessIntelligenceConfig.aiGatewayApiKey) {
    return gateway(modelId);
  }
  return google(stripGooglePrefix(modelId));
}

export function createAccessIntelligenceAgent(ctx: ServerAccessContext) {
  return new ToolLoopAgent({
    model: getAccessIntelligenceModel(),
    instructions: ACCESS_INTELLIGENCE_INSTRUCTIONS,
    tools: {
      ...createAccessIntelligenceTools(ctx),
      ...createLearningTools(ctx),
    },
    stopWhen: stepCountIs(accessIntelligenceConfig.maxAgentSteps),
    output: Output.object({
      schema: agentAccessPlanSchema,
      name: "AccessPlan",
      description:
        "Structured access plan driven by deterministic tool results — not free-form speculation.",
    }),
  });
}

export type AccessIntelligenceAgent = ReturnType<
  typeof createAccessIntelligenceAgent
>;
