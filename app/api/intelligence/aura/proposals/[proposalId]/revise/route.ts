import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { requireMission } from "@/lib/aura/mission/store";
import { getProposal, reviseAuraProposal } from "@/lib/aura/proposals";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ proposalId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { proposalId } = await ctx.params;
  const proposal = getProposal(proposalId);
  if (!proposal) {
    return NextResponse.json({ error: "AURA_PROPOSAL_NOT_FOUND" }, { status: 404 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* empty */
  }
  try {
    const mission = requireMission(proposal.missionId);
    const result = reviseAuraProposal({
      proposalId,
      userId: mission.participantId,
      changes: {
        recipientLabel:
          typeof body.recipientLabel === "string"
            ? body.recipientLabel
            : undefined,
        questions: Array.isArray(body.questions)
          ? (body.questions as string[])
          : undefined,
        omitArrivalTime: body.omitArrivalTime === true,
        payload:
          typeof body.payload === "object" && body.payload
            ? (body.payload as Record<string, unknown>)
            : undefined,
      },
    });
    return NextResponse.json({
      ...result,
      notice: "New version requires a new shadow review. Prior receipts remain historical.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
