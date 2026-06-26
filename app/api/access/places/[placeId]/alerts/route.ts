import {
  createAccessAlert,
  listActiveAlertsForPlace,
  resolveAccessAlert,
} from "@/lib/access-alerts/access-alert-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAccessAlertSchema } from "@/lib/validation/access-report";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const alerts = await listActiveAlertsForPlace(placeId);
  return jsonOk({ alerts });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createAccessAlertSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const alert = await createAccessAlert({
    placeId,
    alertType: parsed.data.alertType,
    title: parsed.data.title,
    description: parsed.data.description,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    expiresAt: parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : undefined,
    reportedById: user.id,
  });

  return jsonOk({ alert: { id: alert.id, status: alert.status } }, 201);
}
