import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getPlatformGapAnalysisSummary,
  upsertPlatformGapOverride,
} from "@/lib/platform-gaps/platform-gap-service";
import type { PlatformGapResolutionStatus } from "@/lib/platform-gaps/types";

const RESOLUTION_STATUSES: PlatformGapResolutionStatus[] = [
  "open",
  "in_progress",
  "mitigated",
  "accepted_risk",
  "closed",
];

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getPlatformGapAnalysisSummary());
}

export async function PATCH(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let body: { code?: string; status?: string; notes?: string | null };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  if (!body.code || typeof body.code !== "string") {
    return jsonError("code is required");
  }
  if (!body.status || typeof body.status !== "string") {
    return jsonError("status is required");
  }
  if (!RESOLUTION_STATUSES.includes(body.status as PlatformGapResolutionStatus)) {
    return jsonError(`status must be one of: ${RESOLUTION_STATUSES.join(", ")}`);
  }

  try {
    const row = await upsertPlatformGapOverride({
      code: body.code,
      status: body.status as PlatformGapResolutionStatus,
      notes: body.notes ?? null,
      actorUserId: user.id,
    });
    return jsonOk({ override: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save override";
    return jsonError(message);
  }
}
