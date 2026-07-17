import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  buildJourneyWorld,
  getLatestWorld,
  listWorldVersions,
} from "@/lib/aura/world-model";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { missionId } = await ctx.params;
  const userId = new URL(req.url).searchParams.get("userId");
  try {
    const mission = requireMission(missionId);
    if (userId && mission.participantId !== userId) {
      return NextResponse.json({ error: "AURA_MISSION_FORBIDDEN" }, { status: 403 });
    }
    const world = getLatestWorld(missionId);
    return NextResponse.json({ world, versions: listWorldVersions(missionId).length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { missionId } = await ctx.params;
  const body = (await req.json()) as { userId: string };
  try {
    const world = buildJourneyWorld({ missionId, userId: body.userId });
    return NextResponse.json({ world });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
