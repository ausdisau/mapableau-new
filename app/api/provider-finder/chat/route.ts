import { createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";

import {
  appendProviderFinderTurn,
  getProviderFinderSession,
  priorAppliedFromSession,
  touchProviderFinderSession,
} from "@/lib/ai/agent-sessions/provider-finder-session";
import { assertProviderFinderChatAllowed } from "@/lib/ai/relational/gates";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { runProviderFinderAskTurn } from "@/lib/provider/finder/ask-bridge";
import {
  PROVIDER_FINDER_CHAT_MAX_TEXT,
  providerFinderChatRequestSchema,
  sliceChatHistory,
  tryLockFinderChatTurn,
  unlockFinderChatTurn,
} from "@/lib/provider/finder/chat-request";
import { extractLastUserText } from "@/lib/provider/finder/conversation/extract-user-text";
import { createFinderChatResponseStream } from "@/lib/provider/finder/conversation/stream-assistant";

/**
 * Streaming chat for guided search and Provider Finder dialogue.
 * IP rate limiting uses a process-local Map and is not globally enforceable
 * across multiple instances. See docs/operations/RATE_LIMITING.md.
 */
export const maxDuration = 30;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = providerFinderChatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid chat request" }, { status: 400 });
  }

  const messages = sliceChatHistory(parsed.data.messages ?? []);
  const userText = extractLastUserText(messages as UIMessage[]);

  if (!userText.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  if (userText.length > PROVIDER_FINDER_CHAT_MAX_TEXT) {
    return Response.json({ error: "Message is too long" }, { status: 400 });
  }

  const sessionId =
    parsed.data.sessionId?.trim() || `finder-${Date.now()}`;
  const formSession = {
    query: parsed.data.session?.query ?? "",
    location: parsed.data.session?.location ?? "",
    providerName: parsed.data.session?.providerName ?? "",
    serviceQuery: parsed.data.session?.serviceQuery ?? "",
    accessQuery: parsed.data.session?.accessQuery ?? "",
    skippedSlots: parsed.data.session?.skippedSlots ?? [],
  };

  if (!tryLockFinderChatTurn(sessionId)) {
    return Response.json(
      { error: "Please wait for the current reply to finish." },
      { status: 409 },
    );
  }

  let handedToStream = false;
  try {
    touchProviderFinderSession(sessionId);
    const existing = getProviderFinderSession(sessionId);

    const gate = await assertProviderFinderChatAllowed({
      tenantId: "anonymous-provider-finder",
      participantId: `finder-session:${sessionId}`,
      actorUserId: `finder-anon:${ip}`,
      silent: false,
    });

    const priorApplied = priorAppliedFromSession(
      sessionId,
      parsed.data.session,
    );

    const turn = await runProviderFinderAskTurn(userText, formSession, {
      priorApplied,
      priorInterpretation: existing?.lastInterpretation,
      agentSessionId: sessionId,
      agentTurnIndex: existing?.turnIndex ?? 0,
    });

    if (turn.agent) {
      appendProviderFinderTurn(sessionId, {
        userText,
        assistantText: turn.replyText,
        applied: turn.applied,
        interpretation: turn.interpretation,
        agent: turn.agent,
      });
    }

    const stream = createFinderChatResponseStream({
      turn,
      useLlmStream:
        gate.allowed &&
        gate.useModelStream &&
        isSearchInterpreterConfigured(),
      onFinally: () => unlockFinderChatTurn(sessionId),
    });

    handedToStream = true;
    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error("[provider-finder/chat]", err);
    return Response.json(
      { error: "Could not process your message." },
      { status: 502 },
    );
  } finally {
    if (!handedToStream) unlockFinderChatTurn(sessionId);
  }
}
