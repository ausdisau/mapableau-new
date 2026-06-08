import { createUIMessageStream, streamText } from "ai";

import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { getInterpreterModel } from "@/lib/search/interpreter/get-model";

import { PROVIDER_FINDER_CHAT_SYSTEM } from "./prompt";
import type { ProviderFinderAskTurn } from "../ask-bridge";
import type { ProviderFinderConversationTurn } from "./run-turn";

type FinderStreamTurn = ProviderFinderConversationTurn | ProviderFinderAskTurn;

export function streamFinderAssistantText(
  turn: FinderStreamTurn,
): AsyncIterable<string> {
  if (!isSearchInterpreterConfigured()) {
    return textIterable(turn.replyText);
  }

  const result = streamText({
    model: getInterpreterModel(),
    system: PROVIDER_FINDER_CHAT_SYSTEM,
    prompt: [
      `User query: ${turn.interpretation.sourceQuery}`,
      `Structured interpretation (JSON): ${JSON.stringify(turn.interpretation)}`,
      `Suggested reply baseline: ${turn.replyText}`,
      "Respond in 2–4 sentences. Do not repeat the JSON.",
    ].join("\n\n"),
    temperature: 0.35,
  });

  return result.textStream;
}

async function* textIterable(text: string): AsyncGenerator<string> {
  yield text;
}

export function createFinderChatResponseStream(options: {
  turn: FinderStreamTurn;
  useLlmStream: boolean;
}) {
  const { turn, useLlmStream } = options;

  return createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({
        type: "data-finderInterpretation",
        id: "finder-interpretation",
        data: {
          interpretation: turn.interpretation,
          applied: turn.applied,
        },
      });

      if (useLlmStream) {
        const stream = streamFinderAssistantText(turn);
        const textId = "finder-assistant-text";
        writer.write({ type: "text-start", id: textId });

        for await (const delta of stream) {
          if (delta) {
            writer.write({ type: "text-delta", id: textId, delta });
          }
        }

        writer.write({ type: "text-end", id: textId });
      } else {
        const textId = "finder-assistant-text";
        writer.write({ type: "text-start", id: textId });
        writer.write({
          type: "text-delta",
          id: textId,
          delta: turn.replyText,
        });
        writer.write({ type: "text-end", id: textId });
      }
    },
  });
}
