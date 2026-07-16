import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  createOfflineVisitPack,
  listOfflinePacks,
  renderOfflinePackHtml,
} from "@/lib/aura/mission/service";
import { requireMission } from "@/lib/aura/mission/store";

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
  if (!auraFlags.offlinePacks) {
    return NextResponse.json(
      { error: "MAPABLE_AURA_OFFLINE_PACKS_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;
  const format = new URL(req.url).searchParams.get("format");
  try {
    const packs = listOfflinePacks(missionId);
    if (format === "html" && packs[0]) {
      return new NextResponse(renderOfflinePackHtml(packs[0]), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return NextResponse.json({ missionId, packs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

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
  if (!auraFlags.offlinePacks) {
    return NextResponse.json(
      { error: "MAPABLE_AURA_OFFLINE_PACKS_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;
  try {
    const mission = requireMission(missionId);
    const pack = createOfflineVisitPack({
      missionId,
      userId: mission.participantId,
    });
    return NextResponse.json({
      pack,
      htmlPreviewAvailable: true,
      privacyWarning:
        "Review included information before download. Delete offline copies from shared devices.",
      excludedByDefault: pack.excludedByDefault,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    const status = message === "AURA_MISSION_STOPPED" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
