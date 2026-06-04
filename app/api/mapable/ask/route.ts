import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { getOptionalApiUser } from "@/lib/api/optional-session";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { apiForbidden } from "@/lib/auth/guards";
import { planCopilotActions } from "@/lib/copilot/actionPlanner";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import { applyGuardrails } from "@/lib/copilot/guardrails";
import { classifyIntent } from "@/lib/copilot/intentRouter";
import { planProviderFinderCopilotActions } from "@/lib/copilot/plan-provider-finder";
import type {
  CopilotAskContext,
  CopilotAskResponse,
  CopilotFinderPayload,
} from "@/lib/copilot/types";
import {
  runProviderFinderAskTurn,
  serialiseFinderPayload,
  type ProviderFinderSessionFields,
} from "@/lib/provider-finder/ask-bridge";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";

const MAX_QUERY_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function parseSessionFields(
  raw: unknown,
): Partial<ProviderFinderSessionFields> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  return {
    query: typeof s.query === "string" ? s.query : "",
    location: typeof s.location === "string" ? s.location : "",
    providerName: typeof s.providerName === "string" ? s.providerName : "",
    serviceQuery: typeof s.serviceQuery === "string" ? s.serviceQuery : "",
    accessQuery: typeof s.accessQuery === "string" ? s.accessQuery : "",
  };
}

function finderFromSerialised(
  payload: ReturnType<typeof serialiseFinderPayload>,
): CopilotFinderPayload {
  return {
    interpretation: payload.interpretation,
    applied: payload.applied,
    searchParams: payload.searchParams,
    replyText: payload.replyText,
  };
}

async function buildGuestProviderFinderResponse(
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: { providerSlug?: string; providerName?: string },
): Promise<CopilotAskResponse> {
  const planned = await planProviderFinderCopilotActions(query, session, options);
  const finder = finderFromSerialised(
    planned.filters.finder as ReturnType<typeof serialiseFinderPayload>,
  );

  return {
    source: "mapable-copilot",
    intent: "provider_finder",
    confidence: 0.9,
    summary: planned.summary,
    answer: planned.plainLanguageAnswer,
    filters: planned.filters,
    actions: planned.actions,
    draftRecords: [],
    requiredConfirmations: [],
    warnings: planned.warnings,
    blockedActions: [],
    finder,
    results: [],
    suggestedPrompts: [
      "OT assessment in Parramatta",
      "Wheelchair accessible transport near me",
      "NDIS registered support worker",
    ],
  };
}

async function maybeAttachFinder(
  response: CopilotAskResponse,
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: { providerSlug?: string; providerName?: string },
): Promise<CopilotAskResponse> {
  if (response.intent === "incident" || response.intent === "billing") {
    return response;
  }

  const turn = await runProviderFinderAskTurn(query, session, options);
  const finder = finderFromSerialised(serialiseFinderPayload(turn));

  return {
    ...response,
    finder,
    filters: { ...response.filters, finder: serialiseFinderPayload(turn) },
  };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const query =
      typeof body.query === "string" ? body.query.trim() : "";
    const mode =
      typeof body.mode === "string" ? body.mode : "All";
    const context: CopilotAskContext =
      body.context === "provider_finder" ? "provider_finder" : "default";
    const participantId =
      typeof body.participantId === "string"
        ? body.participantId
        : undefined;
    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId
        : `session-${Date.now()}`;
    const session = parseSessionFields(body.session);
    const providerSlug =
      typeof body.providerSlug === "string" ? body.providerSlug : undefined;
    const providerName =
      typeof body.providerName === "string" ? body.providerName : undefined;

    if (!query) {
      return NextResponse.json(
        {
          error: "Please enter a question or request so MapAble can help.",
        },
        { status: 400 },
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Your message is too long. Please shorten it and try again.",
        },
        { status: 400 },
      );
    }

    const user = await getOptionalApiUser();

    if (context === "provider_finder" && !user) {
      const response = await buildGuestProviderFinderResponse(
        query,
        session,
        { providerSlug, providerName },
      );
      return NextResponse.json(response);
    }

    if (!user) {
      const authRequired = await requireApiSession();
      return authRequired instanceof Response ? authRequired : NextResponse.json(
        { error: "Sign in required." },
        { status: 401 },
      );
    }

    const effectiveParticipantId = participantId ?? user.id;

    try {
      await assertCanAccessParticipantData(user, effectiveParticipantId);
    } catch (e) {
      if (e instanceof ParticipantAccessError) {
        return apiForbidden(e.message);
      }
      throw e;
    }

    const intent = classifyIntent(query, mode, {
      context: context === "provider_finder" ? "provider_finder" : "default",
    });
    const copilotContext = await buildCopilotContext(effectiveParticipantId);

    const planned = await planCopilotActions(
      {
        query,
        mode,
        intent,
        context: copilotContext,
        sessionId,
        participantId: effectiveParticipantId,
      },
      { session, providerSlug, providerName },
    );

    const guarded = await applyGuardrails({
      planned,
      context: copilotContext,
      participantId: effectiveParticipantId,
    });

    let response: CopilotAskResponse = {
      source: "mapable-copilot",
      intent: intent.type,
      confidence: intent.confidence,
      summary: guarded.summary,
      answer: guarded.plainLanguageAnswer,
      filters: guarded.filters,
      actions: guarded.actions,
      draftRecords: guarded.draftRecords,
      requiredConfirmations: guarded.requiredConfirmations,
      warnings: guarded.warnings,
      blockedActions: guarded.blockedActions,
      results: [],
      suggestedPrompts: buildSuggestedPrompts(intent.type),
    };

    if (intent.type === "provider_finder" && guarded.filters.finder) {
      response.finder = finderFromSerialised(
        guarded.filters.finder as ReturnType<typeof serialiseFinderPayload>,
      );
    } else if (context === "provider_finder") {
      response = await maybeAttachFinder(response, query, session, {
        providerSlug,
        providerName,
      });
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}

function buildSuggestedPrompts(
  intent: CopilotAskResponse["intent"],
): string[] {
  switch (intent) {
    case "provider_finder":
      return [
        "OT near Parramatta",
        "Support worker with Auslan",
        "Registered provider in Newcastle",
      ];
    case "combined":
      return [
        "Add Tuesday 9am physio time",
        "Check consent for pickup notes",
      ];
    case "billing":
      return ["What evidence is missing?", "Explain this line item"];
    case "incident":
      return ["I need urgent help", "Start a complaint"];
    default:
      return [
        "I need support and transport to physio",
        "Help me understand my NDIS plan",
      ];
  }
}
