import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { stopAuraMission } from "@/lib/aura/mission/service";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { missionId } = await ctx.params;
  let userId = "demo-participant-taylor";
  try {
    const body = (await req.json()) as { userId?: string };
    if (body.userId) userId = body.userId;
  } catch {
    // optional body
  }
  try {
    const result = stopAuraMission(missionId, userId);
    return NextResponse.json({
      missionId,
      status: result.mission.status,
      stopState: result.mission.stopState,
      revokedLeaseCount: result.revokedLeaseCount,
      auditEventCount: result.witness.length,
      response: result.response,
      preservedCompletedRecords: true,
      nonAiRoutes: result.response.nonAiRoutes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    const status =
      message === "AURA_MISSION_NOT_FOUND"
        ? 404
        : message === "AURA_MISSION_FORBIDDEN"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
