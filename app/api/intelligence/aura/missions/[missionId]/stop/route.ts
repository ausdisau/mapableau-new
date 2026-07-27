import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAuraDisabledResponse } from "@/lib/aura/feature-flags";
import { stopAuraMission } from "@/lib/aura/stop";

export const runtime = "nodejs";

const bodySchema = z.object({
  snapshotId: z.string().optional(),
});

type MissionCtx = { params: Promise<{ missionId: string }> };

export async function POST(req: Request, ctx: MissionCtx) {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await ctx.params;

  let body: unknown = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const mission = stopAuraMission(missionId, user.id);
    return jsonOk({ mission, snapshotId: parsed.data.snapshotId ?? null });
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
