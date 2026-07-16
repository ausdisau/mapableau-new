import { z } from "zod";

import {
  resolveAccessIntelligenceUser,
} from "@/lib/access-intelligence/api-auth";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { getHarbourPhysicalSimulator } from "@/lib/access-intelligence/physical/simulator/harbour-simulator";

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
    return Response.json({
      placeId,
      emergency: getHarbourPhysicalSimulator().getEmergency(),
    });
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
        active: z.boolean(),
        reason: z.string().max(300).optional(),
      })
      .safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "active boolean required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const sim = getHarbourPhysicalSimulator();
    sim.emitEvent(parsed.data.active ? "emergency_on" : "emergency_off");
    return Response.json({
      placeId,
      emergency: sim.getEmergency(),
      notice: parsed.data.active
        ? "Emergency mode active — physical actuations fail closed."
        : "Emergency mode cleared in simulator.",
      reason: parsed.data.reason,
      actorId: auth.userId,
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
