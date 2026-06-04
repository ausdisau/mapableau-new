import { createUIMessageStreamResponse } from "ai";

import { extractLastUserText } from "@/lib/provider-finder/conversation/extract-user-text";
import { createFinderChatResponseStream } from "@/lib/provider-finder/conversation/stream-assistant";
import { runProviderFinderConversationTurn } from "@/lib/provider-finder/conversation/run-turn";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import type { UIMessage } from "ai";

import type { ProviderFinderChatUIMessage } from "@/types/provider-finder-chat";

export const maxDuration = 30;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  if (!checkRateLimit(ip)) {
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
    const turn = await runProviderFinderConversationTurn(userText, {
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
