import {
  createAccessAlertSchema,
} from "@/lib/validation/access-alert";
import {
  createAccessAlert,
  listActiveAlerts,
} from "@/lib/access-alerts/access-alert-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeId = url.searchParams.get("placeId") ?? undefined;
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const radiusKm = url.searchParams.get("radiusKm");

  const alerts = await listActiveAlerts({
    placeId,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    radiusKm: radiusKm ? Number(radiusKm) : undefined,
  });

  return jsonOk({
    alerts: alerts.map((a) => ({
      id: a.id,
      placeId: a.placeId,
      placeName: a.place?.name,
      alertType: a.alertType,
      title: a.title,
      description: a.description,
      status: a.status,
      latitude: a.latitude,
      longitude: a.longitude,
      expiresAt: a.expiresAt,
      createdAt: a.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createAccessAlertSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const alert = await createAccessAlert({
      userId: user.id,
      input: parsed.data,
    });
    return jsonOk({ alert }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALERT_RATE_LIMIT") {
      return jsonError("Too many alerts submitted recently", 429);
    }
    throw e;
  }
}
