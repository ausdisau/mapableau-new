import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAuraDisabledResponse } from "@/lib/aura/feature-flags";
import {
  buildJourneyWorld,
  getLatestWorld,
  listWorldVersions,
} from "@/lib/aura/world-model";

export const runtime = "nodejs";

type MissionCtx = { params: Promise<{ missionId: string }> };

export async function GET(_req: Request, ctx: MissionCtx) {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await ctx.params;
  const world = getLatestWorld(missionId);
  if (!world) return jsonError("AURA_WORLD_NOT_FOUND", 404);
  return jsonOk({
    world,
    versions: listWorldVersions(missionId).map((w) => w.version),
  });
}

const createSchema = z.object({}).passthrough();

export async function POST(req: Request, ctx: MissionCtx) {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await ctx.params;

  let body: unknown = {};
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const world = buildJourneyWorld({ missionId, userId: user.id });
    return jsonOk({ world });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    if (message === "AURA_MISSION_FORBIDDEN") {
      return jsonError(message, 403);
    }
    if (message === "AURA_MISSION_NOT_FOUND") {
      return jsonError(message, 404);
    }
    return jsonError(message, 400);
  }
}
