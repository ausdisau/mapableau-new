import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapableHomeDisabledResponse,
  mapableHomeFlags,
} from "@/lib/config/mapable-home";
import {
  HomeServiceError,
  evaluateRoutineForSimulator,
  listSimulatorRoutines,
} from "@/lib/home/service";

const evaluateSchema = z.object({
  routineId: z.enum([
    "GOING_OUT",
    "COMING_HOME",
    "SUPPORT_WORKER_ARRIVING",
    "GOING_TO_BED",
  ]),
});

export async function GET() {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    return mapableHomeDisabledResponse("MAPABLE_HOME_ENV_SIMULATOR_ENABLED");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    return jsonOk({
      simulation: true,
      routines: listSimulatorRoutines(),
    });
  } catch (err) {
    if (err instanceof HomeServiceError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    throw err;
  }
}

export async function POST(req: Request) {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    return mapableHomeDisabledResponse("MAPABLE_HOME_ENV_SIMULATOR_ENABLED");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = evaluateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const evaluation = await evaluateRoutineForSimulator(parsed.data.routineId);
    return jsonOk({ simulation: true, evaluation });
  } catch (err) {
    if (err instanceof HomeServiceError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    throw err;
  }
}
