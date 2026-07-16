import { NextResponse } from "next/server";
import { z } from "zod";

import {
  comparePredictedVsObserved,
  createEvidenceCorrectionDraft,
  getOutcomeForMission,
  listCorrectionsForMission,
  recordOutcome,
} from "@/lib/aura/calibration";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

const bodySchema = z.object({
  participantId: z.string(),
  skipped: z.boolean().optional(),
  missionOutcome: z
    .enum([
      "completed",
      "partially_completed",
      "not_completed",
      "cancelled_by_participant",
      "cancelled_by_service",
      "not_attempted",
      "unknown",
    ])
    .optional(),
  observations: z.array(z.any()).optional(),
  disclosureReview: z
    .object({
      appropriate: z.enum(["yes", "partly", "no", "not_sure"]),
      comment: z.string().optional(),
    })
    .optional(),
  participantComment: z.string().optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await ctx.params;
  return NextResponse.json({ outcome: getOutcomeForMission(missionId) });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  try {
    const outcome = recordOutcome({
      missionId,
      ...parsed.data,
    });
    return NextResponse.json({ outcome });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  return POST(req, ctx);
}
