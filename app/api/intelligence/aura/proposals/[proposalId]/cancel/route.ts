import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { requireMission } from "@/lib/aura/mission/store";
import { cancelAuraProposal, getProposal } from "@/lib/aura/proposals";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
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
  try {
    const mission = requireMission(proposal.missionId);
    const cancelled = cancelAuraProposal({
      proposalId,
      userId: mission.participantId,
    });
    return NextResponse.json({ proposal: cancelled });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
