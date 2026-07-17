import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { deleteOfflinePack } from "@/lib/aura/mission/service";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ missionId: string; packId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json(
      { error: "MAPABLE_AURA_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId, packId } = await ctx.params;
  try {
    const mission = requireMission(missionId);
    deleteOfflinePack({
      missionId,
      packId,
      userId: mission.participantId,
    });
    return NextResponse.json({ ok: true, packId, status: "deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
