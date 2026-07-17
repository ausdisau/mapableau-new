import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import { executeApprovedProposal } from "@/lib/aura/execution";
import { getProposal } from "@/lib/aura/proposals";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

const bodySchema = z.object({
  approvalId: z.string(),
  sessionId: z.string().optional(),
  stepUpVerified: z.boolean().optional(),
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
  const mission = requireMission(proposal.missionId);
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
    const result = await executeApprovedProposal({
      proposalId,
      participantId: mission.participantId,
      approvalId: parsed.data.approvalId,
      sessionId: parsed.data.sessionId,
      stepUpVerified: parsed.data.stepUpVerified ?? true,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json(
      { error: message },
      {
        status: message.includes("STOPPED")
          ? 409
          : message.includes("FORBIDDEN")
            ? 403
            : 400,
      },
    );
  }
}
