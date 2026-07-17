import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import { processSyncQueue } from "@/lib/aura/pocket/sync";

export const runtime = "nodejs";

const syncSchema = z.object({
  userId: z.string(),
});

export async function POST(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  try {
    const body = syncSchema.parse(await req.json());
    const result = processSyncQueue({
      userId: body.userId,
      rejectOfflineExecutionApproval: true,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
