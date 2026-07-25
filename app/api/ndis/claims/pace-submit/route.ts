import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isPaceTelemetryClaimingEnabled } from "@/lib/ndis/pace-config";
import {
  buildPaceClaimFromShift,
  PaceSubmitRequestSchema,
} from "@/lib/ndis/pace-claim-service";

export async function POST(req: Request) {
  if (!isPaceTelemetryClaimingEnabled()) {
    return jsonError("PACE telemetry claiming is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "provider:ndis:claim") ||
    hasPermission(user.primaryRole, "provider:ndia:claim");
  if (!allowed) return apiForbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = PaceSubmitRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await buildPaceClaimFromShift({
      completedShiftId: parsed.data.completedShiftId,
      actorUserId: user.id,
    });
    return jsonOk(
      {
        ...result,
        notice:
          "DRAFT_ONLY PACE claim payload generated. Not submitted to NDIA. Human confirmation required.",
      },
      201
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "PACE claim failed";
    if (message === "NOT_FOUND") return jsonError(message, 404);
    if (message === "SHIFT_TELEMETRY_INCOMPLETE") {
      return jsonError(
        "Shift is missing check-in/check-out telemetry required for PACE claim draft",
        409
      );
    }
    if (message === "PACE_TELEMETRY_CLAIMING_DISABLED") {
      return jsonError("PACE telemetry claiming is disabled", 404);
    }
    return jsonError(message, 400);
  }
}
