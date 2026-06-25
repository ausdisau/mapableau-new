import { NextResponse } from "next/server";

import { verifyMapableAgentCronBearer } from "@/lib/mapable-agent/cron-auth";
import { isMapableAgentConfigured } from "@/lib/mapable-agent/config";
import { embedPendingDocumentChunks } from "@/lib/mapable-agent/rag/embed-pending";

/** Vercel cron: embed pending document chunks (replaces BullMQ worker on serverless). */
export const maxDuration = 120;
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isMapableAgentConfigured()) {
    return NextResponse.json({ ok: false, error: "MapAble Agent disabled" }, { status: 503 });
  }

  if (!verifyMapableAgentCronBearer(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await embedPendingDocumentChunks();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Embed failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
