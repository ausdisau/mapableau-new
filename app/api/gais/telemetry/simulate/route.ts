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
  buildSyntheticObservation,
  ingestObservation,
  isTelemetrySimulatorAllowed,
  toPublicObservation,
  validateObservationTimestamp,
} from "@/lib/gais/telemetry";

/**
 * Development-only synthetic telemetry simulator.
 * Always marks payloads as SYNTHETIC TEST DATA.
 */
export async function POST(req: Request) {
  if (!mapableGaisFlags.telemetryEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_TELEMETRY_ENABLED");
  }

  if (!isTelemetrySimulatorAllowed()) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_TELEMETRY_SIMULATOR_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`gais:telemetry:sim:${user.id}:${ip}`, {
      windowMs: 60_000,
      max: 20,
    })
  ) {
    return jsonError("Rate limit exceeded", 429);
  }

  let body: unknown = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const synthetic = buildSyntheticObservation(
    typeof body === "object" && body != null
      ? (body as Parameters<typeof buildSyntheticObservation>[0])
      : {},
  );

  const parsed = accessibilityObservationIngestSchema.safeParse(synthetic);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const ts = validateObservationTimestamp(parsed.data.observedAt);
  if (!ts.ok) return jsonError(ts.error, 400);

  const observation = ingestObservation({
    payload: parsed.data,
    ingestedByUserId: user.id,
    synthetic: true,
  });

  return jsonOk({
    observation: toPublicObservation(observation),
    meta: {
      ...GAIS_RESPONSE_META,
      synthetic: true,
      label: "SYNTHETIC TEST DATA",
      actuation: false,
      note: "Development simulator observation. Not real-world evidence.",
    },
  });
}
