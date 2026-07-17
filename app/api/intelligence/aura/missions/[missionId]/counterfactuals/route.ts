import { NextResponse } from "next/server";

import { auraCounterfactualInputSchema } from "@/lib/aura/counterfactual";
import { auraFlags } from "@/lib/aura/feature-flags";
import {
  listCounterfactuals,
  runCounterfactual,
} from "@/lib/aura/mission/service";
import { requireMission } from "@/lib/aura/mission/store";

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
    requireMission(missionId);
    return NextResponse.json({
      missionId,
      counterfactuals: listCounterfactuals(missionId),
      disclaimer:
        "Simulated scenarios. No real venue, transport, care or booking state was changed.",
    });
  } catch {
    return NextResponse.json(
      { error: "AURA_MISSION_NOT_FOUND" },
      { status: 404 },
    );
  }
}

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
  if (!auraFlags.counterfactuals) {
    return NextResponse.json(
      { error: "MAPABLE_AURA_COUNTERFACTUALS_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = auraCounterfactualInputSchema.safeParse({
    ...(typeof body === "object" && body ? body : {}),
    missionId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const mission = requireMission(missionId);
    // Ownership: demo uses mission participant; no authority elevation from client
    const userId = mission.participantId;
    const result = runCounterfactual(parsed.data, userId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    const status =
      message === "AURA_MISSION_STOPPED"
        ? 409
        : message === "AURA_MISSION_FORBIDDEN"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
