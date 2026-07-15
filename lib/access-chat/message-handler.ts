import { parseAccessIntent } from "@/lib/access-chat/parse-intent";
import { runHybridAccessSearch } from "@/lib/access-chat/hybrid-search";
import {
  appendAccessChatTurn,
  newAccessChatMessageId,
  touchAccessChatSession,
} from "@/lib/access-chat/session";
import { runSafetyReview } from "@/lib/access-chat/safety-check";
import { synthesizeAccessChatReply } from "@/lib/access-chat/synthesize-response";
import { accessChatConfig } from "@/lib/config/access-chat";
import type {
  AccessChatMessageRequest,
  AccessSearchIntent,
  AccessSearchResult,
} from "@/types/access-chat";

export type AccessChatMessageResponse = {
  sessionId: string;
  messageId: string;
  replyText: string;
  intent: AccessSearchIntent;
  results: AccessSearchResult[];
  meta: {
    candidateCount: number;
    parseEngineId: string;
    synthesisEngineId: string;
    safetyEngineId: string;
    vectorUsed: boolean;
  };
};

export async function handleAccessChatMessage(
  input: AccessChatMessageRequest,
): Promise<AccessChatMessageResponse> {
  const sessionId =
    input.sessionId?.trim() || `access-chat-${Date.now()}`;
  touchAccessChatSession(sessionId);

  const userMessageId = newAccessChatMessageId();
  appendAccessChatTurn(sessionId, {
    role: "user",
    content: input.message,
    messageId: userMessageId,
    createdAt: Date.now(),
  });

  let intent: AccessSearchIntent;
  let parseEngineId: string;

  if (input.intentOverride) {
    intent = input.intentOverride;
    parseEngineId = "client/override";
  } else {
    const parsed = await parseAccessIntent(input.message, {
      locationHint: input.locationHint,
      userContext: input.userContext,
      shareAccessProfile: input.shareAccessProfile,
    });
    intent = parsed.intent;
    parseEngineId = parsed.engineId;
  }

  const search = await runHybridAccessSearch(intent, {
    limit: accessChatConfig.maxResultsCeil,
  });

  const synthesis = await synthesizeAccessChatReply(intent, search.results);
  const safety = await runSafetyReview(synthesis.replyText, search.results);

  const assistantMessageId = newAccessChatMessageId();
  appendAccessChatTurn(sessionId, {
    role: "assistant",
    content: safety.text,
    results: search.results,
    intent,
    messageId: assistantMessageId,
    createdAt: Date.now(),
  });

  return {
    sessionId,
    messageId: assistantMessageId,
    replyText: safety.text,
    intent,
    results: search.results,
    meta: {
      candidateCount: search.candidateCount,
      parseEngineId,
      synthesisEngineId: synthesis.engineId,
      safetyEngineId: safety.engineId,
      vectorUsed: search.vectorUsed,
    },
  };
}
