import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import { queueOfflineStop, processSyncQueue } from "@/lib/aura/pocket/sync";

export const runtime = "nodejs";

const stopSchema = z.object({
  userId: z.string(),
  missionId: z.string(),
  snapshotId: z.string().optional(),
});

export async function POST(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  try {
    const body = stopSchema.parse(await req.json());
    const receipt = queueOfflineStop(body);
    return NextResponse.json({ receipt, queued: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
