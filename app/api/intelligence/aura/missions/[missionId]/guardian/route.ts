import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  enableGuardian,
  stopGuardian,
  getGuardian,
  listAlerts,
  processLiftOutage,
  createGuardianProposalDraft,
} from "@/lib/aura/guardian";

export const runtime = "nodejs";

const enableSchema = z.object({
  userId: z.string(),
  urgency: z.enum(["information", "attention", "urgent"]).optional(),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { missionId } = await ctx.params;
  return NextResponse.json({
    guardian: getGuardian(missionId),
    alerts: listAlerts(missionId),
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ missionId: string; action?: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { missionId } = await ctx.params;

  try {
    const body = await req.json();

    if (body.simulateLiftOutage) {
      const alert = processLiftOutage({
        missionId,
        userId: body.userId,
        placeId: body.placeId ?? "place-harbour-civic",
        elementId: body.elementId ?? "hcc-lift-west",
      });
      return NextResponse.json({ alert });
    }

    if (body.createProposal) {
      return NextResponse.json(
        createGuardianProposalDraft({
          missionId,
          userId: body.userId,
          alertId: body.alertId,
          actionType: "ask_venue_about_alternative",
        }),
      );
    }

    const parsed = enableSchema.parse(body);
    return NextResponse.json({
      guardian: enableGuardian({ missionId, ...parsed }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
