import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  ACTION_APPROVAL_LABELS,
  ACTION_LIMITATION_NOTICES,
  getExecutionApprovalForProposal,
  grantExecutionApproval,
} from "@/lib/aura/execution";
import { getProposal } from "@/lib/aura/proposals";
import { requireMission } from "@/lib/aura/mission/store";

export const runtime = "nodejs";

const bodySchema = z.object({
  decision: z.enum(["approved_for_execution", "declined", "cancelled"]),
  sessionId: z.string().optional(),
  stepUpVerified: z.boolean().optional(),
  stepUpMethod: z.string().optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ proposalId: string }> },
) {
  const { proposalId } = await ctx.params;
  const proposal = getProposal(proposalId);
  if (!proposal) {
    return NextResponse.json({ error: "AURA_PROPOSAL_NOT_FOUND" }, { status: 404 });
  }
  const mission = requireMission(proposal.missionId);
  return NextResponse.json({
    approval: getExecutionApprovalForProposal(proposalId),
    approvalLabel: ACTION_APPROVAL_LABELS[proposal.actionType],
    limitationNotice: ACTION_LIMITATION_NOTICES[proposal.actionType],
    proposal: {
      recipient: proposal.target.recipientLabel,
      fieldsShared: proposal.disclosure.fieldsShared,
      fieldsOmitted: proposal.disclosure.fieldsOmitted,
      expectedResult: proposal.expectedResult,
      possibleFailures: proposal.possibleFailures,
      expiresAt: proposal.expiresAt,
    },
    notice: "Fresh execution approval is required. Shadow acceptance does not authorise execution.",
  });
}

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
    const approval = grantExecutionApproval({
      proposalId,
      participantId: mission.participantId,
      decision: parsed.data.decision,
      sessionId: parsed.data.sessionId,
      stepUpVerified: parsed.data.stepUpVerified,
      stepUpMethod: parsed.data.stepUpMethod,
    });
    return NextResponse.json({
      approval,
      notice:
        parsed.data.decision === "approved_for_execution"
          ? "Execution approval granted. This is separate from shadow review."
          : "Execution approval not granted.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    const status = message.includes("STEP_UP")
      ? 401
      : message.includes("FORBIDDEN")
        ? 403
        : message.includes("STOPPED")
          ? 409
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
