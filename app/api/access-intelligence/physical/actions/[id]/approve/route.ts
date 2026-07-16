import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { PhysicalSystemsError } from "@/lib/access-intelligence/physical/errors";
import { getPhysicalActionTransactionManager } from "@/lib/access-intelligence/physical/services/propose-action";

const bodySchema = z.object({
  note: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid approval payload.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Optional note must be a short string.",
        },
        { status: 400 },
      );
    }
    const manager = getPhysicalActionTransactionManager();
    const existing = await manager.getExecution(id);
    if (!existing || existing.proposal.userId !== userId) {
      throw new PhysicalSystemsError(
        "ACTION_NOT_FOUND",
        "Physical action execution was not found for this user.",
      );
    }
    const execution = await manager.approve(id, userId, parsed.data.note);
    return Response.json({ execution });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
