import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAuraDisabledResponse } from "@/lib/aura/feature-flags";
import {
  buildMissionSnapshot,
  deleteSnapshot,
  listSnapshots,
} from "@/lib/aura/pocket";

export const runtime = "nodejs";

const createSchema = z.object({
  missionId: z.string().min(1),
  presentationPreference: z.string().max(64).optional(),
});

export async function GET() {
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  // Participant identity from session — never query userId (IDOR).
  return jsonOk({ snapshots: listSnapshots(user.id) });
}

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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const snapshot = buildMissionSnapshot({
      missionId: parsed.data.missionId,
      userId: user.id,
      presentationPreference: parsed.data.presentationPreference,
    });
    return jsonOk({ snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return jsonError(message, 400);
  }
}

export async function DELETE(req: Request) {
  // Feature gate required on DELETE (Wave 6 prompt).
  if (isAuraDisabledResponse()) {
    return jsonError("MAPABLE_AURA_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const snapshotId = new URL(req.url).searchParams.get("snapshotId");
  if (!snapshotId) {
    return jsonError("MISSING_PARAMS", 400);
  }
  const ok = deleteSnapshot(user.id, snapshotId);
  return jsonOk({ deleted: ok });
}
