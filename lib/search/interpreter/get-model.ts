import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { gateway } from "ai";

import {
  isSearchInterpreterConfigured,
  searchInterpreterConfig,
  type InterpreterProvider,
} from "@/lib/config/search-interpreter";

export function resolveInterpreterProvider(
  modelId: string = searchInterpreterConfig.modelId,
): InterpreterProvider {
  if (searchInterpreterConfig.aiGatewayApiKey) {
    return "gateway";
  }

  const normalized = modelId.trim().toLowerCase();
  if (
    normalized.startsWith("openai/") ||
    normalized.startsWith("gpt-") ||
    normalized.startsWith("o1") ||
    normalized.startsWith("o3") ||
    normalized.startsWith("o4")
  ) {
    return "openai";
  }

  if (normalized.startsWith("google/") || normalized.startsWith("gemini-")) {
    return "google";
  }

  // Bare / unknown ids: prefer matching whichever direct key exists.
  if (searchInterpreterConfig.openaiApiKey) return "openai";
  if (searchInterpreterConfig.googleApiKey) return "google";
  return "google";
}

export function getInterpreterEngineId(): string {
  const modelId = searchInterpreterConfig.modelId;
  const provider = resolveInterpreterProvider(modelId);

  switch (provider) {
    case "gateway":
      return `ai-sdk/gateway/${modelId}`;
    case "openai":
      return `ai-sdk/openai/${stripProviderPrefix(modelId, "openai/")}`;
    case "google":
      return `ai-sdk/google/${stripProviderPrefix(modelId, "google/")}`;
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

export function getInterpreterModel() {
  if (!isSearchInterpreterConfigured()) {
    throw new Error("Search interpreter is not configured");
  }

  const modelId = searchInterpreterConfig.modelId;
  const provider = resolveInterpreterProvider(modelId);

  switch (provider) {
    case "gateway":
      return gateway(modelId);
    case "openai":
      if (!searchInterpreterConfig.openaiApiKey) {
        throw new Error(
          "OpenAI model selected but OPENAI_API_KEY is not configured",
        );
      }
      return openai(stripProviderPrefix(modelId, "openai/"));
    case "google":
      if (!searchInterpreterConfig.googleApiKey) {
        throw new Error(
          "Google model selected but GOOGLE_GENERATIVE_AI_API_KEY is not configured",
        );
      }
      return google(stripProviderPrefix(modelId, "google/"));
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

function stripProviderPrefix(id: string, prefix: string): string {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}
