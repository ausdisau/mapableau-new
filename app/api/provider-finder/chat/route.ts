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
import { getOptionalApiUser } from "@/lib/api/optional-session";
import {
  findFinderDiscoveryMatches,
  loadFinderPreference,
} from "@/lib/provider/finder/personalisation/discovery";
import type { FinderSearchScope } from "@/lib/provider/finder/personalisation/matching";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { runProviderFinderAskTurn } from "@/lib/provider/finder/ask-bridge";
import { extractLastUserText } from "@/lib/provider/finder/conversation/extract-user-text";
import { createFinderChatResponseStream } from "@/lib/provider/finder/conversation/stream-assistant";
import type { ProviderFinderChatUIMessage } from "@/types/provider-finder-chat";

/** Streaming chat for guided search and Provider Finder dialogue. */
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
    sessionId?: string;
    scope?: FinderSearchScope;
    useSavedPreferences?: boolean;
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

  if (!Array.isArray(body.messages) || body.messages.length > 30 ||
      (body.sessionId && (typeof body.sessionId !== "string" || body.sessionId.length > 120))) {
    return Response.json({ error: "Invalid conversation payload" }, { status: 400 });
  }
  const messages = body.messages;
  const userText = extractLastUserText(messages as UIMessage[]);
  if (userText.length > 700) return Response.json({ error: "Message is too long" }, { status: 413 });

  if (!userText.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const sessionId =
    body.sessionId?.trim() || `finder-${Date.now()}`;
  const safeField = (value: unknown) => typeof value === "string" ? value.slice(0, 180) : "";
  const formSession = {
    query: safeField(body.session?.query),
    location: safeField(body.session?.location),
    providerName: safeField(body.session?.providerName),
    serviceQuery: safeField(body.session?.serviceQuery),
    accessQuery: safeField(body.session?.accessQuery),
  };

  try {
    touchProviderFinderSession(sessionId);
    const existing = getProviderFinderSession(sessionId);

    const gate = await assertProviderFinderChatAllowed({
      tenantId: "anonymous-provider-finder",
      participantId: `finder-session:${sessionId}`,
      actorUserId: `finder-anon:${ip}`,
      silent: false,
    });

    const priorApplied = priorAppliedFromSession(sessionId, formSession);

    const turn = await runProviderFinderAskTurn(userText, formSession, {
      priorApplied,
      agentSessionId: sessionId,
      agentTurnIndex: existing?.turnIndex ?? 0,
    });

    // The new search path is default-off and never reads a health profile.
    const discoveryEnabled = process.env.PROVIDER_FINDER_DISCOVERY_ENABLED === "true";
    const currentUser = discoveryEnabled ? await getOptionalApiUser() : null;
    const preference = discoveryEnabled && body.useSavedPreferences && currentUser
      ? await loadFinderPreference(currentUser)
      : null;
    const scope: FinderSearchScope = discoveryEnabled && currentUser &&
      (body.scope === "workers" || body.scope === "both")
      ? body.scope
      : "providers";
    const discovery = discoveryEnabled
      ? await findFinderDiscoveryMatches({
          user: currentUser,
          scope,
          applied: turn.applied,
          providerResults: turn.providerResults,
          preference: preference?.enabled ? preference : null,
        })
      : null;
    if (discovery && scope !== "providers") {
      const workerCount = discovery.matches.filter((match) => match.kind === "worker").length;
      turn.replyText += workerCount
        ? ` I also found ${workerCount} worker-published profile${workerCount === 1 ? "" : "s"}; check the match reasons and verify screening independently.`
        : " No opted-in worker profiles matched those filters. You can broaden your search.";
    }

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
      discovery,
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
