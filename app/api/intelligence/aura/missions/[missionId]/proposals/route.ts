import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { requireMission } from "@/lib/aura/mission/store";
import {
  createAuraActionProposal,
  listProposalsForMission,
  verifyAuraActionProposal,
  auraProposalActionTypeSchema,
} from "@/lib/aura/proposals";

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
    requireMission(missionId);
    return NextResponse.json({
      missionId,
      proposals: listProposalsForMission(missionId),
      notice:
        "Shadow mode: AURA will not send, book, publish, notify or change anything.",
    });
  } catch {
    return NextResponse.json({ error: "AURA_MISSION_NOT_FOUND" }, { status: 404 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ missionId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  if (
    !auraFlags.proposals &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    return NextResponse.json(
      { error: "MAPABLE_AURA_PROPOSALS_DISABLED" },
      { status: 403 },
    );
  }
  const { missionId } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const actionParsed = auraProposalActionTypeSchema.safeParse(body.actionType);
  if (!actionParsed.success) {
    return NextResponse.json({ error: "INVALID_ACTION_TYPE" }, { status: 400 });
  }

  try {
    const mission = requireMission(missionId);
    const proposal = createAuraActionProposal({
      missionId,
      userId: mission.participantId,
      actionType: actionParsed.data,
      recipientLabel:
        typeof body.recipientLabel === "string" ? body.recipientLabel : undefined,
      questions: Array.isArray(body.questions)
        ? (body.questions as string[])
        : undefined,
      payload:
        typeof body.payload === "object" && body.payload
          ? (body.payload as Record<string, unknown>)
          : undefined,
    });
    const verification = verifyAuraActionProposal(proposal.id);
    return NextResponse.json({
      proposal,
      verification,
      notice:
        "No message, booking, report, notification or other external action will be performed.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    const status =
      message === "AURA_MISSION_STOPPED"
        ? 409
        : message === "AURA_MISSION_FORBIDDEN"
          ? 403
          : message.includes("PROHIBITED")
            ? 403
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
