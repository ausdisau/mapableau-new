import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import { requireMission } from "@/lib/aura/mission/store";
import {
  getProposal,
  runProposalShadowEvaluation,
} from "@/lib/aura/proposals";

export const runtime = "nodejs";

const bodySchema = z.object({
  reviewId: z.string().min(1),
});

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
    const mission = requireMission(proposal.missionId);
    const result = runProposalShadowEvaluation({
      proposalId,
      userId: mission.participantId,
      reviewId: parsed.data.reviewId,
    });
    return NextResponse.json({
      ...result,
      executionAttempted: false,
      externalSideEffects: 0,
      notice:
        "Shadow evaluation complete. No message was sent, no booking was created, no report was published.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json(
      { error: message },
      { status: message.includes("STOPPED") ? 409 : 400 },
    );
  }
}
