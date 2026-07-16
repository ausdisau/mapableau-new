import type { ChatResult } from "@/lib/mapable-agent/model/types";
import { toPlainLanguage } from "@/lib/mapable-agent/utils";

export type RenderedAgentResponse = {
  text: string;
  reasoningSummary?: string;
  showReasoning: boolean;
};

export function renderAgentResponse(
  result: ChatResult,
  options?: { showReasoning?: boolean },
): RenderedAgentResponse {
  return {
    text: toPlainLanguage(result.text),
    reasoningSummary: result.reasoningSummary,
    showReasoning: options?.showReasoning ?? false,
  };
}
