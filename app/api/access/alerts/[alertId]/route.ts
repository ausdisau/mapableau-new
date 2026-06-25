import { updateAccessAlertSchema } from "@/lib/validation/access-alert";
import { updateAccessAlert } from "@/lib/access-alerts/access-alert-service";
import { canResolveAlert } from "@/lib/access-alerts/alert-access-policy";
import { isAccessModerator, isVenueOwner } from "@/lib/access-community/access-role-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { alertId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = updateAccessAlertSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const alert = await prisma.accessAlert.findUnique({ where: { id: alertId } });
  if (!alert) return jsonError("Alert not found", 404);

  if (parsed.data.status === "resolved") {
    const canResolve = await canResolveAlert(user, alert);
    if (!canResolve) return jsonError("Forbidden", 403);
  }

  const updated = await updateAccessAlert({
    alertId,
    userId: user.id,
    status: parsed.data.status,
    isModerator: await isAccessModerator(user),
    isVenueOwner: alert.placeId
      ? await isVenueOwner(user.id, alert.placeId)
      : false,
  });

  return jsonOk({ alert: updated });
}
