import { NextResponse } from "next/server";

import { getOptionalApiUser } from "@/lib/api/optional-session";
import {
  getMapableAgentRuntimeIssues,
  isMapableAgentConfigured,
} from "@/lib/mapable-agent/config";
import {
  createAgentSession,
  runMapableAgentTurn,
} from "@/lib/mapable-agent/orchestrator";

/** gpt-oss tool loops may exceed default 10s on Vercel. */
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isMapableAgentConfigured()) {
    return NextResponse.json({ error: "MapAble Agent is not enabled" }, { status: 503 });
  }

  const runtimeIssues = getMapableAgentRuntimeIssues().filter(
    (i) => i.code === "ollama_on_vercel" || i.code === "vllm_unreachable",
  );
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

  try {
    const result = await runMapableAgentTurn({
      sessionId,
      message,
      actorUserId: user?.id ?? null,
      participantId: body.participantId ?? user?.id ?? null,
    });
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Agent turn failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
