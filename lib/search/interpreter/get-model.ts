import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { gateway, type LanguageModel } from "ai";

import { resolveModelForCapability } from "@/lib/ai/platform/models/gateway";
import { assertModelCallAllowed } from "@/lib/ai/platform/policies/kill-switches";
import { isAiPlatformFoundationEnabled } from "@/lib/config/ai-platform";
import {
  canonicalizeInterpreterModelId,
  gptOssApiModelId,
  isGptOssModelId,
  isGptOssSelfHostedConfigured,
  isSearchInterpreterConfigured,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";

export function getInterpreterEngineId(): string {
  if (isGptOssSelfHostedConfigured()) {
    return `ai-sdk/openai-compatible/${gptOssApiModelId(searchInterpreterConfig.modelId)}`;
  }
  if (
    isGptOssModelId(searchInterpreterConfig.modelId) &&
    searchInterpreterConfig.aiGatewayApiKey
  ) {
    return `ai-sdk/gateway/${canonicalizeInterpreterModelId(searchInterpreterConfig.modelId)}`;
  }
  if (searchInterpreterConfig.aiGatewayApiKey) {
    return `ai-sdk/gateway/${searchInterpreterConfig.modelId}`;
  }
  return `ai-sdk/google/${stripGooglePrefix(searchInterpreterConfig.modelId)}`;
}

/**
 * Returns a model usable by AI SDK `streamText` / `generateObject` / `ToolLoopAgent`.
 *
 * When the AI platform foundation is enabled, resolution goes through the
 * canonical capability gateway (allowlist + kill switches). Otherwise the
 * legacy path is used but still respects global/capability kill switches.
 */
export function getInterpreterModel(
  capabilityKey = "search.nl_interpreter",
): LanguageModel {
  if (!isSearchInterpreterConfigured()) {
    throw new Error("Search interpreter is not configured");
  }

  const gate = assertModelCallAllowed({ capabilityKey });
  if (!gate.allowed) {
    throw new Error(`AI_MODEL_CALL_BLOCKED:${gate.reason ?? "blocked"}`);
  }

  if (isAiPlatformFoundationEnabled()) {
    const resolved = resolveModelForCapability({ capabilityKey });
    if (!resolved.ok) {
      throw new Error(`AI_MODEL_GATEWAY_BLOCKED:${resolved.reason}`);
    }
    return resolved.model;
  }

  return resolveLegacyInterpreterModel();
}

function resolveLegacyInterpreterModel(): LanguageModel {
  const modelId = searchInterpreterConfig.modelId;

  // Prefer explicit self-hosted endpoint when set; otherwise AI Gateway
  // (production path for https://mapable.com.au).
  if (isGptOssSelfHostedConfigured()) {
    const provider = createOpenAICompatible({
      name: "gpt-oss",
      baseURL: searchInterpreterConfig.gptOssBaseUrl,
      apiKey: searchInterpreterConfig.gptOssApiKey || undefined,
    });
    return provider(gptOssApiModelId(modelId)) as unknown as LanguageModel;
  }

  if (searchInterpreterConfig.aiGatewayApiKey) {
    const gatewayModelId = isGptOssModelId(modelId)
      ? canonicalizeInterpreterModelId(modelId)
      : modelId;
    return gateway(gatewayModelId);
  }

  return google(stripGooglePrefix(modelId));
}

function stripGooglePrefix(id: string): string {
  return id.startsWith("google/") ? id.slice("google/".length) : id;
}
