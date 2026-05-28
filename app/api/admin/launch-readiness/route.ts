import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  LAUNCH_READINESS_STATUSES,
  getLaunchReadinessSummary,
  completeLaunchItem,
  updateLaunchReadinessItem,
} from "@/lib/launch-readiness/launch-readiness-service";
import type { LaunchReadinessStatus } from "@prisma/client";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getLaunchReadinessSummary());
}

export async function PATCH(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let body: {
    code?: string;
    status?: string;
    notes?: string | null;
    evidenceDocumentId?: string | null;
    itemId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  if (body.itemId && !body.code) {
    try {
      const item = await completeLaunchItem(
        body.itemId,
        user.id,
        body.evidenceDocumentId ?? undefined
      );
      return jsonOk({ item });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update item";
      return jsonError(message);
    }
  }

  if (!body.code || typeof body.code !== "string") {
    return jsonError("code is required");
  }
  if (!body.status || typeof body.status !== "string") {
    return jsonError("status is required");
  }
  if (
    !LAUNCH_READINESS_STATUSES.includes(body.status as LaunchReadinessStatus)
  ) {
    return jsonError(`status must be one of: ${LAUNCH_READINESS_STATUSES.join(", ")}`);
  }

  try {
    const item = await updateLaunchReadinessItem({
      code: body.code,
      status: body.status as LaunchReadinessStatus,
      actorUserId: user.id,
      notes: body.notes ?? null,
      evidenceDocumentId: body.evidenceDocumentId ?? null,
    });
    return jsonOk({ item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update item";
    if (message === "NOT_FOUND") return jsonError("Launch item not found", 404);
    return jsonError(message);
  }
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const item = await completeLaunchItem(
    body.itemId,
    user.id,
    body.evidenceDocumentId
  );
  return jsonOk({ item });
}
