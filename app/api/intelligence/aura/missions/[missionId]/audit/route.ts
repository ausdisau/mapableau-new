import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  getMissionAudit,
  getMissionAuditReplay,
  verifyMissionAudit,
} from "@/lib/aura/mission/service";

export const runtime = "nodejs";

export async function GET(
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
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");

  try {
    if (mode === "manifest" || auraFlags.auditReplay) {
      return NextResponse.json(getMissionAuditReplay(missionId));
    }
    return NextResponse.json({
      missionId,
      events: getMissionAudit(missionId),
      verification: verifyMissionAudit(missionId),
      note: "Structured evidence and decisions only. No hidden chain-of-thought.",
    });
  } catch {
    return NextResponse.json(
      { error: "AURA_MISSION_NOT_FOUND" },
      { status: 404 },
    );
  }
}
