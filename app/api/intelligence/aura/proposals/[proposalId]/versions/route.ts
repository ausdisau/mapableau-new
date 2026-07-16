import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { getProposal, listProposalVersions } from "@/lib/aura/proposals";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ proposalId: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { proposalId } = await ctx.params;
  if (!getProposal(proposalId)) {
    return NextResponse.json({ error: "AURA_PROPOSAL_NOT_FOUND" }, { status: 404 });
  }
  const versions = listProposalVersions(proposalId).map((p) => ({
    id: p.id,
    version: p.version,
    state: p.state,
    proposalHash: p.proposalHash,
    previousVersionId: p.previousVersionId,
    supersededById: p.supersededById,
    createdAt: p.createdAt,
  }));
  return NextResponse.json({ proposalId, versions });
}
