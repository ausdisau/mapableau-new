import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  buildMissionSnapshot,
  listSnapshots,
  deleteSnapshot,
} from "@/lib/aura/pocket";

export const runtime = "nodejs";

const createSchema = z.object({
  missionId: z.string(),
  userId: z.string(),
  presentationPreference: z.string().optional(),
});

export async function GET(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
  }
  return NextResponse.json({ snapshots: listSnapshots(userId) });
}

export async function POST(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  try {
    const body = createSchema.parse(await req.json());
    const snapshot = buildMissionSnapshot(body);
    return NextResponse.json({ snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const snapshotId = url.searchParams.get("snapshotId");
  const userId = url.searchParams.get("userId");
  if (!snapshotId || !userId) {
    return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
  }
  const ok = deleteSnapshot(userId, snapshotId);
  return NextResponse.json({ deleted: ok });
}
