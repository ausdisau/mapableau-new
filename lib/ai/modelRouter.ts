import type { LanguageModel } from "ai";

import { getGeminiEngineId, tryGetGeminiModel } from "@/lib/ai/geminiClient";
import { getOpenAiEngineId, tryGetOpenAiModel } from "@/lib/ai/openaiClient";
import {
  isGeminiConfigured,
  isOpenAiConfigured,
} from "@/lib/config/access-chat";

export type ModelTask =
  | "intent_parse"
  | "query_rewrite"
  | "result_synthesis"
  | "fresh_web_grounding"
  | "image_embedding"
  | "safety_review"
  | "fallback_answer";

export type RoutedModel = {
  model: LanguageModel;
  engineId: string;
  provider: "openai" | "gemini";
  task: ModelTask;
  fallbackUsed: boolean;
};

const OPENAI_PRIMARY: ModelTask[] = [
  "intent_parse",
  "query_rewrite",
  "result_synthesis",
];

const GEMINI_PRIMARY: ModelTask[] = [
  "fresh_web_grounding",
  "image_embedding",
  "safety_review",
  "fallback_answer",
];

/**
 * Route a single task to one provider. Never calls both for the same request.
 * OpenAI is primary for orchestration; Gemini for fallback / grounding / multimodal.
 */
export function resolveModelForTask(task: ModelTask): RoutedModel | null {
  const preferOpenAi = OPENAI_PRIMARY.includes(task);
  const preferGemini = GEMINI_PRIMARY.includes(task);

  if (preferOpenAi) {
    const openai = tryGetOpenAiModel();
    if (openai) {
      return {
        model: openai,
        engineId: getOpenAiEngineId(),
        provider: "openai",
        task,
        fallbackUsed: false,
      };
    }
    const gemini = tryGetGeminiModel();
    if (gemini) {
      return {
        model: gemini,
        engineId: getGeminiEngineId(),
        provider: "gemini",
        task,
        fallbackUsed: true,
      };
    }
    return null;
  }

  if (preferGemini) {
    const gemini = tryGetGeminiModel();
    if (gemini) {
      return {
        model: gemini,
        engineId: getGeminiEngineId(),
        provider: "gemini",
        task,
        fallbackUsed: false,
      };
    }
    // image_embedding has no OpenAI text fallback in v1
    if (task === "image_embedding") return null;

    const openai = tryGetOpenAiModel();
    if (openai) {
      return {
        model: openai,
        engineId: getOpenAiEngineId(),
        provider: "openai",
        task,
        fallbackUsed: true,
      };
    }
    return null;
  }

  return null;
}

export function describeModelAvailability(): {
  openai: boolean;
  gemini: boolean;
} {
  return {
    openai: isOpenAiConfigured(),
    gemini: isGeminiConfigured(),
  };
}
