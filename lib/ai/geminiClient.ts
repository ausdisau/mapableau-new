import { google } from "@ai-sdk/google";
import { gateway, type LanguageModel } from "ai";

import {
  accessChatConfig,
  isGeminiConfigured,
} from "@/lib/config/access-chat";

function stripGooglePrefix(id: string): string {
  return id.startsWith("google/") ? id.slice("google/".length) : id;
}

/**
 * Gemini / Google generative model. Prefers AI Gateway when configured,
 * then GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY via @ai-sdk/google.
 */
export function getGeminiModel(
  modelId = accessChatConfig.geminiModel,
): LanguageModel {
  if (!isGeminiConfigured()) {
    throw new Error(
      "Gemini is not configured (set GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or AI_GATEWAY_API_KEY)",
    );
  }

  if (accessChatConfig.aiGatewayApiKey) {
    return gateway(modelId);
  }

  return google(stripGooglePrefix(modelId));
}

export function getGeminiEngineId(
  modelId = accessChatConfig.geminiModel,
): string {
  if (accessChatConfig.aiGatewayApiKey) {
    return `ai-sdk/gateway/${modelId}`;
  }
  return `ai-sdk/google/${stripGooglePrefix(modelId)}`;
}

export function tryGetGeminiModel(
  modelId = accessChatConfig.geminiModel,
): LanguageModel | null {
  if (!isGeminiConfigured()) return null;
  return getGeminiModel(modelId);
}
