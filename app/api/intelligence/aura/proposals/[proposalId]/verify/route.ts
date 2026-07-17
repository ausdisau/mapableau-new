import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { getProposal, verifyAuraActionProposal } from "@/lib/aura/proposals";

export const runtime = "nodejs";

export async function POST(
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
  try {
    const verification = verifyAuraActionProposal(proposalId);
    return NextResponse.json({
      verification,
      futureExecutionEligible: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
