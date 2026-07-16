import { createUIMessageStreamResponse } from "ai";
import { NextResponse } from "next/server";

import { getOptionalApiUser } from "@/lib/api/optional-session";
import {
  getMapableAgentRuntimeIssues,
  isMapableAgentConfigured,
} from "@/lib/mapable-agent/config";
import { checkConsentGate } from "@/lib/mapable-agent/consent-gate";
import { classifyMapableAgentIntent } from "@/lib/mapable-agent/intent-router";
import {
  createAgentSession,
  runMapableAgentTurn,
} from "@/lib/mapable-agent/orchestrator";
import { createMapableAgentChatStream } from "@/lib/mapable-agent/stream-chat";
import { prisma } from "@/lib/prisma";

/** gpt-oss tool loops may exceed default 10s on Vercel. */
export const maxDuration = 60;
export const runtime = "nodejs";

const PARTICIPANT_SCOPES = ["profile.read"] as const;

function runtimeBlockingIssues() {
  return getMapableAgentRuntimeIssues().filter(
    (i) => i.code === "ollama_on_vercel" || i.code === "vllm_unreachable",
  );
}

export async function POST(req: Request) {
  if (!isMapableAgentConfigured()) {
    return NextResponse.json({ error: "MapAble Agent is not enabled" }, { status: 503 });
  }

  const runtimeIssues = runtimeBlockingIssues();
  if (runtimeIssues.length > 0) {
    return NextResponse.json(
      { error: runtimeIssues[0]?.message, code: runtimeIssues[0]?.code },
      { status: 503 },
    );
  }

  const body = (await req.json()) as {
    sessionId?: string;
    message?: string;
    participantId?: string;
    stream?: boolean;
  };

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const user = await getOptionalApiUser();
  let sessionId = body.sessionId;

  if (!sessionId) {
    const session = await createAgentSession({
      actorUserId: user?.id ?? null,
      participantId: body.participantId ?? user?.id ?? null,
    });
    sessionId = session.id;
  }

  const turn = {
    sessionId,
    message,
    actorUserId: user?.id ?? null,
    participantId: body.participantId ?? user?.id ?? null,
  };

  if (body.stream) {
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const intent = classifyMapableAgentIntent(message);
    const participantId = turn.participantId ?? session.participantId;
    const consent = await checkConsentGate({
      participantId,
      scopes:
        intent.type === "plan" || intent.type === "billing"
          ? [...PARTICIPANT_SCOPES]
          : undefined,
    });

    if (!consent.allowed) {
      return NextResponse.json({
        sessionId,
        text: "We need your consent before we can use participant records.",
        requiredConfirmations: consent.requiredConfirmations,
      });
    }

    await prisma.agentMessage.create({
      data: { sessionId, role: "user", content: message },
    });

    const history = session.messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

    const stream = createMapableAgentChatStream({ turn, history });
    return createUIMessageStreamResponse({ stream });
  }

  try {
    const result = await runMapableAgentTurn(turn);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Agent turn failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
