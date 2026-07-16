import { z } from "zod";

import {
  resolveAccessIntelligenceUser,
} from "@/lib/access-intelligence/api-auth";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import {
  getHarbourPhysicalSimulator,
  type HarbourSimulatorEvent,
} from "@/lib/access-intelligence/physical/simulator/harbour-simulator";

const EVENTS = [
  "main_lift_outage",
  "main_lift_restore",
  "door_fault",
  "door_restore",
  "corridor_obstruction",
  "emergency_on",
  "emergency_off",
  "toilet_confirm_open",
  "toilet_unknown",
  "lift_west_arrive",
  "lift_west_timeout",
] as const;

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
    const state = getHarbourPhysicalSimulator().getState();
    return Response.json({
      placeId,
      state: {
        emergency: state.emergency,
        devices: state.devices,
        mainLiftOutage: state.mainLiftOutage,
        doorEntBFault: state.doorEntBFault,
        corridorObstructed: state.corridorObstructed,
        eventLog: state.eventLog.slice(-20),
      },
      fictionalNotice: "Venue simulator controls fictional Harbour events only.",
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
      .discriminatedUnion("op", [
        z.object({ op: z.literal("reset") }),
        z.object({ op: z.literal("emit"), event: z.enum(EVENTS) }),
      ])
      .safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid simulator op.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const sim = getHarbourPhysicalSimulator();
    if (parsed.data.op === "reset") sim.reset();
    else sim.emitEvent(parsed.data.event as HarbourSimulatorEvent);
    return Response.json({
      ok: true,
      actorId: auth.userId,
      state: getHarbourPhysicalSimulator().getState().eventLog.slice(-8),
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
