import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { PhysicalSystemsError } from "@/lib/access-intelligence/physical/errors";
import { getPhysicalActionTransactionManager } from "@/lib/access-intelligence/physical/services/propose-action";

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
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
    const manager = getPhysicalActionTransactionManager();
    const existing = await manager.getExecution(id);
    if (!existing || existing.proposal.userId !== userId) {
      throw new PhysicalSystemsError(
        "ACTION_NOT_FOUND",
        "Physical action execution was not found for this user.",
      );
    }
    const execution = await manager.cancel(
      id,
      parsed.success ? parsed.data.reason : undefined,
    );
    return Response.json({ execution });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
