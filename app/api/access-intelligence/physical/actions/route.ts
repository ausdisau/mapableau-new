import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { proposePhysicalAction , getPhysicalActionTransactionManager } from "@/lib/access-intelligence/physical/services/propose-action";

const proposeSchema = z.object({
  capabilityId: z.string().min(1),
  rationale: z.string().min(3).max(500),
  parameters: z.record(z.string(), z.unknown()).optional(),
  placeId: z.string().default(HARBOUR_PLACE_ID),
});

export async function GET(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId") ?? undefined;
    const manager = getPhysicalActionTransactionManager();
    const executions = await manager.listExecutions({ userId, placeId });
    return Response.json({ executions });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = proposeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid action proposal.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Provide capabilityId and rationale.",
        },
        { status: 400 },
      );
    }
    const execution = await proposePhysicalAction({
      placeId: parsed.data.placeId,
      userId,
      capabilityId: parsed.data.capabilityId,
      rationale: parsed.data.rationale,
      parameters: parsed.data.parameters,
    });
    return Response.json({ execution });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
