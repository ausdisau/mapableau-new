import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { requireMission, saveMission } from "@/lib/aura/mission/store";
import { runTaylorHarbourPlan } from "@/lib/aura/scenarios/taylor-harbour";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { missionId } = await ctx.params;
  try {
    const mission = requireMission(missionId);
    if (mission.stopState) {
      return NextResponse.json({ error: "AURA_MISSION_STOPPED" }, { status: 409 });
    }
    const { mission: updated, response } = runTaylorHarbourPlan(mission);
    saveMission(updated);
    return NextResponse.json({ ...response, writeCount: 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    const status = message === "AURA_MISSION_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
