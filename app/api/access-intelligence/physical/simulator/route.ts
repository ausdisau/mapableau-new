import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { getPhysicalConfigurationSnapshot } from "@/lib/access-intelligence/physical/configuration";
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

const bodySchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("reset") }),
  z.object({
    op: z.literal("emit"),
    event: z.enum(EVENTS),
  }),
]);

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const state = getHarbourPhysicalSimulator().getState();
    return Response.json({
      configuration: getPhysicalConfigurationSnapshot(),
      state: {
        emergency: state.emergency,
        devices: state.devices,
        mainLiftOutage: state.mainLiftOutage,
        doorEntBFault: state.doorEntBFault,
        corridorObstructed: state.corridorObstructed,
        toiletConfirmed: state.toiletConfirmed,
        eventLog: state.eventLog,
        observations: state.observations,
      },
      fictionalNotice:
        "Physical Environment Simulator — Harbour Civic Centre is fictional demonstration data.",
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid simulator operation.",
          code: "VALIDATION_ERROR",
          recoveryHint: 'Use op "reset" or op "emit" with a known event.',
        },
        { status: 400 },
      );
    }
    const sim = getHarbourPhysicalSimulator();
    if (parsed.data.op === "reset") {
      sim.reset();
    } else {
      sim.emitEvent(parsed.data.event as HarbourSimulatorEvent);
    }
    const state = sim.getState();
    return Response.json({
      ok: true,
      state: {
        emergency: state.emergency,
        devices: state.devices,
        mainLiftOutage: state.mainLiftOutage,
        doorEntBFault: state.doorEntBFault,
        corridorObstructed: state.corridorObstructed,
        toiletConfirmed: state.toiletConfirmed,
        eventLog: state.eventLog.slice(-12),
      },
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
