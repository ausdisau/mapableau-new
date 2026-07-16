import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { requireMission } from "@/lib/aura/mission/store";
import { getProposal, getProposalVerification } from "@/lib/aura/proposals";

export const runtime = "nodejs";

export async function GET(
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
    requireMission(proposal.missionId);
  } catch {
    return NextResponse.json({ error: "AURA_MISSION_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({
    proposal,
    verification: getProposalVerification(proposalId),
    notice:
      "Shadow mode: AURA will not send, book, publish, notify or change anything.",
  });
}
