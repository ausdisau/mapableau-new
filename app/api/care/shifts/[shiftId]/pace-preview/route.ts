import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isPaceTelemetryClaimingEnabled } from "@/lib/ndis/pace-config";
import { getPaceShiftPreview } from "@/lib/ndis/pace-claim-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  if (!isPaceTelemetryClaimingEnabled()) {
    return jsonError("PACE telemetry claiming is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "provider:ndis:claim") ||
    hasPermission(user.primaryRole, "provider:ndia:claim") ||
    hasPermission(user.primaryRole, "care:shift:work") ||
    hasPermission(user.primaryRole, "billing:view_provider");
  if (!allowed) return apiForbidden();

  const { shiftId } = await params;
  try {
    const preview = await getPaceShiftPreview(shiftId);
    return jsonOk(preview);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Preview failed";
    if (message === "NOT_FOUND") return jsonError(message, 404);
    return jsonError(message, 400);
  }
}
