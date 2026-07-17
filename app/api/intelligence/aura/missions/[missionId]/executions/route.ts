import { NextResponse } from "next/server";

import { listExecutionsForMission } from "@/lib/aura/execution";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await ctx.params;
  requireMission(missionId);
  return NextResponse.json({ executions: listExecutionsForMission(missionId) });
}
