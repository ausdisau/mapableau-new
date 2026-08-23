import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import {
  accessibilityObservationIngestSchema,
  ingestObservation,
  toPublicObservation,
  validateObservationTimestamp,
} from "@/lib/gais/telemetry";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

export async function POST(req: Request) {
  if (!mapableGaisFlags.telemetryEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_TELEMETRY_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`gais:telemetry:ingest:${user.id}:${ip}`, {
      windowMs: RATE_WINDOW_MS,
      max: RATE_MAX,
    })
  ) {
    return jsonError("Rate limit exceeded", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = accessibilityObservationIngestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (!parsed.data.sourceDeviceId?.trim()) {
    return jsonError("sourceDeviceId (device identity) is required", 400);
  }

  const ts = validateObservationTimestamp(parsed.data.observedAt);
  if (!ts.ok) return jsonError(ts.error, 400);

  const observation = ingestObservation({
    payload: parsed.data,
    ingestedByUserId: user.id,
  });

  return jsonOk({
    observation: toPublicObservation(observation),
    meta: {
      ...GAIS_RESPONSE_META,
      telemetryScope: "pilot_ingest",
      actuation: false,
      autoPublished: false,
      verificationState: "SENSOR_OBSERVED",
      note: "Sensor observations start as SENSOR_OBSERVED / received. They do not become VERIFIED or public evidence automatically.",
    },
  });
}
