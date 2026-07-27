import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAuraDisabledResponse } from "@/lib/aura/feature-flags";
import {
  enableGuardian,
  getGuardian,
  listAlerts,
  processLiftOutage,
} from "@/lib/aura/guardian";
import { getLatestWorld } from "@/lib/aura/world-model";

export const runtime = "nodejs";

type MissionCtx = { params: Promise<{ missionId: string }> };

const enableSchema = z.object({
  urgency: z.enum(["information", "attention", "urgent"]).optional(),
});

const simulateSchema = z.object({
  simulateLiftOutage: z.literal(true),
  placeId: z.string().optional(),
  elementId: z.string().optional(),
});

export async function GET(_req: Request, ctx: MissionCtx) {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await ctx.params;
  return jsonOk({
    guardian: getGuardian(missionId),
    alerts: listAlerts(missionId),
  });
}

export async function POST(req: Request, ctx: MissionCtx) {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await ctx.params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const simulate = simulateSchema.safeParse(body);
  if (simulate.success) {
    // Require a pre-existing journey world before simulating outage.
    if (!getLatestWorld(missionId)) {
      return jsonError("AURA_WORLD_NOT_FOUND", 404);
    }
    try {
      const alert = processLiftOutage({
        missionId,
        userId: user.id,
        placeId: simulate.data.placeId ?? "place-harbour-civic",
        elementId: simulate.data.elementId ?? "hcc-lift-west",
      });
      return jsonOk({ alert });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AURA_ERROR";
      if (message === "AURA_MISSION_FORBIDDEN") {
        return jsonError(message, 403);
      }
      if (message === "AURA_WORLD_NOT_FOUND") {
        return jsonError(message, 404);
      }
      return jsonError(message, 400);
    }
  }

  const parsed = enableSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    return jsonOk({
      guardian: enableGuardian({
        missionId,
        userId: user.id,
        urgency: parsed.data.urgency,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    if (message === "AURA_MISSION_FORBIDDEN") {
      return jsonError(message, 403);
    }
    return jsonError(message, 400);
  }
}
