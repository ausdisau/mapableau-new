import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { PhysicalSystemsError } from "@/lib/access-intelligence/physical/errors";
import { getPhysicalActionTransactionManager } from "@/lib/access-intelligence/physical/services/propose-action";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const { id } = await ctx.params;
    const execution = await getPhysicalActionTransactionManager().getExecution(id);
    if (!execution || execution.proposal.userId !== userId) {
      throw new PhysicalSystemsError(
        "ACTION_NOT_FOUND",
        "Physical action execution was not found for this user.",
      );
    }
    return Response.json({ execution });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
