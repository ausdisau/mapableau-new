import { NextResponse } from "next/server";

import {
  comparePredictedVsObserved,
  getCalibrationComparison,
  getOutcomeForMission,
} from "@/lib/aura/calibration";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await ctx.params;
  const outcome = getOutcomeForMission(missionId);
  if (!outcome) {
    return NextResponse.json({ error: "AURA_OUTCOME_NOT_FOUND" }, { status: 404 });
  }
  const comparison = getCalibrationComparison(missionId, outcome.id);
  return NextResponse.json({ comparison });
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await ctx.params;
  const mission = requireMission(missionId);
  const outcome = getOutcomeForMission(missionId);
  if (!outcome) {
    return NextResponse.json({ error: "AURA_OUTCOME_NOT_FOUND" }, { status: 404 });
  }
  const comparison = comparePredictedVsObserved(mission, outcome);
  return NextResponse.json({ comparison });
}
