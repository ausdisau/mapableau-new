import { getModel } from "@/lib/ai/platform/models/registry";
import {
  isLocalModelRoutingEnabled,
  isNativeIntelligenceRndEnabled,
} from "@/lib/config/native-intelligence";

import type { LocalInferenceRequest, LocalInferenceResult } from "./types";

/**
 * Experimental local / open-weight inference adapter.
 * Initial state: Labs only, evaluation gated. No production replacement.
 * Does not call real GPU infra — stubbed deterministic local assist to avoid
 * unbounded compute spend until an owner decision is recorded.
 */
export function runLocalInference(
  request: LocalInferenceRequest
): LocalInferenceResult {
  if (!isNativeIntelligenceRndEnabled()) {
    return {
      ok: false,
      reason: "rnd_disabled",
      useDeterministicFallback: true,
    };
  }
  if (!isLocalModelRoutingEnabled()) {
    return {
      ok: false,
      reason: "local_routing_disabled",
      useDeterministicFallback: true,
    };
  }

  const model = getModel(request.modelId);
  if (!model || model.provider !== "local_oss") {
    return {
      ok: false,
      reason: "model_not_local_oss",
      useDeterministicFallback: true,
    };
  }
  if (model.evaluationStatus === "unevaluated") {
    return {
      ok: false,
      reason: "evaluation_incomplete",
      useDeterministicFallback: true,
    };
  }

  const clipped = request.inputText.slice(0, 2000).trim();
  const maxTokens = request.maxOutputTokens ?? model.maxOutputTokens;

  if (request.taskKind === "intent_classification") {
    return {
      ok: true,
      modelId: request.modelId,
      outputText: `Experimental local intent parse (${maxTokens} tok budget).`,
      structured: {
        intent: heuristicIntent(clipped),
        confidence: "low",
        experimental: true,
      },
      experimental: true,
      labsOnly: true,
      productionSupported: false,
    };
  }

  if (request.taskKind === "domain_routing") {
    return {
      ok: true,
      modelId: request.modelId,
      outputText: "Experimental local domain hint.",
      structured: {
        domains: heuristicDomains(clipped),
        experimental: true,
      },
      experimental: true,
      labsOnly: true,
      productionSupported: false,
    };
  }

  return {
    ok: true,
    modelId: request.modelId,
    outputText: buildPlainAssist(clipped, request.taskKind),
    experimental: true,
    labsOnly: true,
    productionSupported: false,
  };
}

function heuristicIntent(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("transport") || lower.includes("ride")) return "transport";
  if (lower.includes("care") || lower.includes("support worker")) return "care";
  if (lower.includes("job") || lower.includes("work")) return "jobs";
  if (lower.includes("access") || lower.includes("ramp")) return "access";
  return "general";
}

function heuristicDomains(text: string): string[] {
  const intent = heuristicIntent(text);
  return intent === "general" ? ["mission"] : [intent, "mission"];
}

function buildPlainAssist(
  text: string,
  taskKind: LocalInferenceRequest["taskKind"]
): string {
  if (!text) {
    return `Local ${taskKind} assist: no input provided (experimental, not production-supported).`;
  }
  return `Local ${taskKind} assist (experimental): ${text.slice(0, 240)}`;
}
