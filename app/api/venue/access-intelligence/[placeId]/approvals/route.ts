import { z } from "zod";

import {
  resolveAccessIntelligenceUser,
} from "@/lib/access-intelligence/api-auth";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { getPhysicalActionTransactionManager } from "@/lib/access-intelligence/physical/services/propose-action";

async function assertVenue(
  request: Request,
  placeId: string,
): Promise<Response | { userId: string }> {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;
  try {
    await requireVenueOperateAccess({
      user,
      placeId,
      roleHeader: request.headers.get("x-access-role"),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 403 });
    }
    throw error;
  }
  return { userId: user.id };
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ placeId: string }> },
) {
  try {
    const { placeId } = await ctx.params;
    const auth = await assertVenue(request, placeId);
    if (auth instanceof Response) return auth;
    const executions = await getPhysicalActionTransactionManager().listExecutions({
      placeId,
    });
    const pending = executions.filter(
      (e) =>
        e.state === "awaiting_venue_approval" ||
        e.state === "awaiting_user_approval" ||
        e.state === "approved",
    );
    return Response.json({ executions: pending });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ placeId: string }> },
) {
  try {
    const { placeId } = await ctx.params;
    const auth = await assertVenue(request, placeId);
    if (auth instanceof Response) return auth;
    const parsed = z
      .object({
        executionId: z.string().min(1),
        note: z.string().max(500).optional(),
      })
      .safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "executionId required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const execution = await getPhysicalActionTransactionManager().venueApprove(
      parsed.data.executionId,
      auth.userId,
      parsed.data.note,
    );
    return Response.json({ execution });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
