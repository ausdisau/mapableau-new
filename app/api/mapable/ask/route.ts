import { NextResponse } from "next/server";

import { planCopilotActions } from "@/lib/copilot/actionPlanner";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import { applyGuardrails } from "@/lib/copilot/guardrails";
import { classifyIntent } from "@/lib/copilot/intentRouter";
import type { CopilotAskResponse, CopilotMode } from "@/lib/copilot/types";
import { buildParticipantGraph } from "@/lib/prms/participantGraph";

const VALID_MODES: CopilotMode[] = [
  "All",
  "Support",
  "Transport",
  "Places",
  "Jobs",
  "Help",
  "NDIS",
];

const MAX_QUERY_LENGTH = 2000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query =
      typeof body.query === "string" ? body.query.trim() : "";
    const mode =
      typeof body.mode === "string" ? body.mode : "All";
    const participantId =
      typeof body.participantId === "string"
        ? body.participantId
        : undefined;
    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId
        : `session-${Date.now()}`;

    if (!query) {
      return NextResponse.json(
        {
          error: "Please enter a question or request so MapAble can help.",
        },
        { status: 400 }
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Your message is too long. Please shorten it and try again.",
        },
        { status: 400 }
      );
    }

    if (
      mode !== "All" &&
      !VALID_MODES.includes(mode as CopilotMode)
    ) {
      return NextResponse.json(
        {
          error: `Unknown mode "${mode}". Use one of: ${VALID_MODES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const intent = classifyIntent(query, mode);
    if (participantId) {
      buildParticipantGraph(participantId);
    }
    const context = participantId
      ? await buildCopilotContext(participantId)
      : null;

    const planned = await planCopilotActions({
      query,
      mode,
      intent,
      context,
      sessionId,
      participantId,
    });

    const guarded = await applyGuardrails({
      planned,
      context,
      participantId,
      query,
    });

    const response: CopilotAskResponse = {
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

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}

function buildSuggestedPrompts(
  intent: CopilotAskResponse["intent"]
): string[] {
  switch (intent) {
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
