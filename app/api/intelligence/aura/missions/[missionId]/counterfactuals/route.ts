import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { getMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

/** Wave 2 surface — returns plan counterfactuals when present. */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  if (!auraFlags.counterfactuals) {
    return NextResponse.json(
      { error: "MAPABLE_AURA_COUNTERFACTUALS_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;
  const mission = getMission(missionId);
  if (!mission) {
    return NextResponse.json({ error: "AURA_MISSION_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({
    missionId,
    counterfactuals: mission.plan?.counterfactuals ?? [],
    advisoryOnly: true,
  });
}
