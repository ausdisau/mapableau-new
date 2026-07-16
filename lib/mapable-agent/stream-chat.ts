import { createUIMessageStream } from "ai";

import { getMapableAgentModelProvider } from "@/lib/mapable-agent/model";
import { renderAgentResponse } from "@/lib/mapable-agent/response-renderer";
import type { OrchestratorTurnInput } from "@/lib/mapable-agent/types";
import { prisma } from "@/lib/prisma";

/** Stream assistant text via gpt-oss provider (after user message is persisted). */
export function createMapableAgentChatStream(input: {
  turn: OrchestratorTurnInput;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const provider = getMapableAgentModelProvider();
  const textId = "mapable-agent-text";

  return createUIMessageStream({
    execute: async ({ writer }) => {
      const messages = [
        ...input.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: input.turn.message },
      ];

      writer.write({ type: "text-start", id: textId });

      let fullText = "";
      for await (const chunk of provider.chatStream({ messages })) {
        if (chunk.type === "text-delta" && chunk.text) {
          fullText += chunk.text;
          writer.write({ type: "text-delta", id: textId, delta: chunk.text });
        }
        if (chunk.type === "done") {
          fullText = chunk.result.text || fullText;
        }
      }

      writer.write({ type: "text-end", id: textId });

      const rendered = renderAgentResponse({ text: fullText });
      await prisma.agentMessage.create({
        data: {
          sessionId: input.turn.sessionId,
          role: "assistant",
          content: rendered.text,
          reasoningSummary: rendered.reasoningSummary,
        },
      });
    },
  });
}
