import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { stopAuraMission } from "@/lib/aura/mission/service";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

/**
 * Stop AURA — mandatory safety capability.
 * Does not require an active model session.
 * Does not accept client-supplied authority level.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json(
      { error: "MAPABLE_AURA_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;

  try {
    const mission = requireMission(missionId);
    // Prefer mission owner; optional demo body may confirm same user only
    let userId = mission.participantId;
    try {
      const body = (await req.json()) as { userId?: string };
      if (body.userId && body.userId !== mission.participantId) {
        return NextResponse.json(
          { error: "AURA_MISSION_FORBIDDEN" },
          { status: 403 },
        );
      }
      if (body.userId) userId = body.userId;
    } catch {
      /* no body */
    }

    const result = stopAuraMission(missionId, userId);
    return NextResponse.json({
      missionId,
      status: result.mission.status,
      stopState: result.mission.stopState,
      stopPhase: result.mission.stopPhase,
      receipt: result.receipt,
      revokedLeaseCount: result.revokedLeaseCount,
      auditEventCount: result.witness.length,
      response: result.response,
      preservedCompletedRecords: true,
      nonAiRoutes: result.response.nonAiRoutes,
      message:
        "AURA has stopped. It cannot continue reading information or generating plans for this mission. Your completed MapAble records and audit history have not been deleted.",
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
