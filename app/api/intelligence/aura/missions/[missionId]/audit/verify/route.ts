import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { verifyMissionAudit } from "@/lib/aura/mission/service";

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
  const { missionId } = await ctx.params;
  try {
    return NextResponse.json(verifyMissionAudit(missionId));
  } catch {
    return NextResponse.json(
      { error: "AURA_MISSION_NOT_FOUND" },
      { status: 404 },
    );
  }
}
