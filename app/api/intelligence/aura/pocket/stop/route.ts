import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAuraDisabledResponse } from "@/lib/aura/feature-flags";
import { queueOfflineStop } from "@/lib/aura/pocket/sync";

export const runtime = "nodejs";

const stopSchema = z.object({
  missionId: z.string().min(1),
  snapshotId: z.string().optional(),
});

export async function POST(req: Request) {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }
  const parsed = stopSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const receipt = queueOfflineStop({
      userId: user.id,
      missionId: parsed.data.missionId,
      snapshotId: parsed.data.snapshotId,
    });
    return jsonOk({ receipt, queued: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    if (message === "AURA_MISSION_FORBIDDEN") {
      return jsonError(message, 403);
    }
    return jsonError(message, 400);
  }
}
