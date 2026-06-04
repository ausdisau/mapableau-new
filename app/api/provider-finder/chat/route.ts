import { createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { runProviderFinderAskTurn } from "@/lib/provider-finder/ask-bridge";
import { extractLastUserText } from "@/lib/provider-finder/conversation/extract-user-text";
import { createFinderChatResponseStream } from "@/lib/provider-finder/conversation/stream-assistant";
import type { ProviderFinderChatUIMessage } from "@/types/provider-finder-chat";

/** Streaming chat for Slack / legacy clients. Provider Finder UI uses `/api/mapable/ask`. */
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

  let body: {
    messages?: ProviderFinderChatUIMessage[];
    session?: {
      query?: string;
      location?: string;
      providerName?: string;
      serviceQuery?: string;
      accessQuery?: string;
    };
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const userText = extractLastUserText(messages as UIMessage[]);

  if (!userText.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const turn = await runProviderFinderAskTurn(userText, {
      query: body.session?.query ?? "",
      location: body.session?.location ?? "",
      providerName: body.session?.providerName ?? "",
      serviceQuery: body.session?.serviceQuery ?? "",
      accessQuery: body.session?.accessQuery ?? "",
    });

    const stream = createFinderChatResponseStream({
      turn,
      useLlmStream: isSearchInterpreterConfigured(),
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error("[provider-finder/chat]", err);
    return Response.json(
      { error: "Could not process your message." },
      { status: 502 },
    );
  }
}
