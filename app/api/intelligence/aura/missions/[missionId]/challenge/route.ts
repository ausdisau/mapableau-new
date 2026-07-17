import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { challengeMissionPlan } from "@/lib/aura/mission/service";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json(
      { error: "MAPABLE_AURA_DISABLED" },
      { status: 403 },
    );
  }
  if (!auraFlags.planChallenge && !auraFlags.counterfactuals) {
    return NextResponse.json(
      { error: "MAPABLE_AURA_PLAN_CHALLENGE_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;
  try {
    const challenge = challengeMissionPlan(missionId);
    return NextResponse.json(challenge);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    const status = message === "AURA_MISSION_STOPPED" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
