import { createOpenAI } from "@ai-sdk/openai";

import type { ChatResult } from "@/lib/mapable-agent/model/types";
import { extractReasoningSummary } from "@/lib/mapable-agent/utils";

export const SYSTEM_GUARDRAIL = `You are MapAble Agent for Australian NDIS participants and support coordinators.

Rules:
- Use plain, trauma-informed Australian English.
- You may explain, summarise, draft, classify and recommend only.
- You must NOT book, approve, pay, submit, send, cancel, disclose externally or escalate without human approval.
- Never expose raw chain-of-thought. Internal reasoning stays internal.
- Do not provide medical, legal or plan-management advice — signpost to qualified professionals.`;

export function createOpenAiCompatibleClient(baseURL: string, apiKey = "mapable-agent") {
  return createOpenAI({ baseURL, apiKey });
}

export function parseChatResult(text: string, reasoning?: string): ChatResult {
  return {
    text: text.trim(),
    reasoningSummary: extractReasoningSummary(reasoning),
    confidence: 0.85,
  };
}
