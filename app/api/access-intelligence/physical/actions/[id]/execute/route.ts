import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { PhysicalSystemsError } from "@/lib/access-intelligence/physical/errors";
import { executeAuthorisedAction } from "@/lib/access-intelligence/physical/services/execute-action";
import { getPhysicalActionTransactionManager } from "@/lib/access-intelligence/physical/services/propose-action";

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const { id } = await ctx.params;
    const manager = getPhysicalActionTransactionManager();
    const existing = await manager.getExecution(id);
    if (!existing || existing.proposal.userId !== userId) {
      throw new PhysicalSystemsError(
        "ACTION_NOT_FOUND",
        "Physical action execution was not found for this user.",
      );
    }
    if (existing.state !== "approved") {
      throw new PhysicalSystemsError(
        "APPROVAL_REQUIRED",
        `Execution must be approved before dispatch (current state: ${existing.state}).`,
      );
    }
    const execution = await executeAuthorisedAction(id);
    return Response.json({
      execution,
      notice:
        existing.proposal.clearlySimulated || existing.proposal.simulatedOnly
          ? "Dispatch used a labelled fictional adapter. Acknowledgement is not success until postconditions verify."
          : "Dispatch completed through Action Gateway.",
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
