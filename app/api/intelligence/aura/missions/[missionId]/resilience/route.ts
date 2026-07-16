import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  assessPlanResilience,
  getResilience,
} from "@/lib/aura/mission/service";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json(
      { error: "MAPABLE_AURA_DISABLED" },
      { status: 403 },
    );
  }
  if (!auraFlags.resilience) {
    return NextResponse.json(
      { error: "MAPABLE_AURA_RESILIENCE_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;
  try {
    const mission = requireMission(missionId);
    const existing = getResilience(mission);
    const assessment = existing ?? assessPlanResilience(missionId);
    return NextResponse.json(assessment);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
