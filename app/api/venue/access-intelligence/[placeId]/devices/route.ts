import { z } from "zod";

import {
  resolveAccessIntelligenceUser,
} from "@/lib/access-intelligence/api-auth";
import { requireVenueOperateAccess } from "@/lib/access-intelligence/auth/venue-access";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { listHarbourCapabilities } from "@/lib/access-intelligence/physical/capabilities/harbour";
import { getPhysicalActionTransactionManager } from "@/lib/access-intelligence/physical/services/propose-action";
import {
  getHarbourPhysicalSimulator,
  type HarbourSimulatorEvent,
} from "@/lib/access-intelligence/physical/simulator/harbour-simulator";

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
      devices: state.devices,
      emergency: state.emergency,
      capabilities: listHarbourCapabilities({
        mainLiftOutage: state.mainLiftOutage,
        doorEntBFault: state.doorEntBFault,
        emergencyActive: state.emergency.active,
        devices: state.devices,
      }),
      fictionalNotice:
        placeId === HARBOUR_PLACE_ID
          ? "Venue Ops Console — fictional Harbour devices only."
          : "Physical twin devices are only seeded for Harbour Civic Centre in this slice.",
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}

const patchSchema = z.object({
  deviceId: z.string().min(1),
  patch: z
    .object({
      health: z
        .enum(["healthy", "degraded", "unhealthy", "offline", "unknown"])
        .optional(),
      condition: z
        .enum([
          "normal",
          "degraded",
          "fault",
          "outage",
          "obstructed",
          "unknown",
          "emergency",
        ])
        .optional(),
      online: z.boolean().optional(),
    })
    .optional(),
  event: z
    .enum([
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
    ])
    .optional(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ placeId: string }> },
) {
  try {
    const { placeId } = await ctx.params;
    const auth = await assertVenue(request, placeId);
    if (auth instanceof Response) return auth;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid device patch.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Provide deviceId with patch and/or simulator event.",
        },
        { status: 400 },
      );
    }
    const sim = getHarbourPhysicalSimulator();
    if (parsed.data.event) {
      sim.emitEvent(parsed.data.event as HarbourSimulatorEvent);
    }
    if (parsed.data.patch) {
      sim.setDeviceState(parsed.data.deviceId, parsed.data.patch);
    }
    return Response.json({
      ok: true,
      device: sim.getDevice(parsed.data.deviceId),
      emergency: sim.getEmergency(),
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
    const body = z
      .object({
        executionId: z.string().min(1),
        note: z.string().max(500).optional(),
      })
      .safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        {
          error: "executionId required for venue approval.",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }
    const manager = getPhysicalActionTransactionManager();
    const execution = await manager.venueApprove(
      body.data.executionId,
      auth.userId,
      body.data.note,
    );
    return Response.json({ execution });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
