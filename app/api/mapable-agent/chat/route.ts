import { NextResponse } from "next/server";

import { getOptionalApiUser } from "@/lib/api/optional-session";
import { isMapableAgentConfigured } from "@/lib/mapable-agent/config";
import {
  createAgentSession,
  runMapableAgentTurn,
} from "@/lib/mapable-agent/orchestrator";

export async function POST(req: Request) {
  if (!isMapableAgentConfigured()) {
    return NextResponse.json({ error: "MapAble Agent is not enabled" }, { status: 503 });
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
