import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { getMissionAudit } from "@/lib/aura/mission/service";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { missionId } = await ctx.params;
  try {
    const events = getMissionAudit(missionId);
    return NextResponse.json({
      missionId,
      events,
      note: "Witness replay is redacted; full Passport data is never logged.",
    });
  } catch {
    return NextResponse.json({ error: "AURA_MISSION_NOT_FOUND" }, { status: 404 });
  }
}
