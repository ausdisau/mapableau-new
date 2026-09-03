import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import {
  GAIS_PROMOTION_STATES,
  getObservation,
  toPublicObservation,
  transitionObservationPromotion,
} from "@/lib/gais/telemetry";

const promoteSchema = z.object({
  observationId: z.string().min(1),
  toState: z.enum(GAIS_PROMOTION_STATES),
  note: z.string().max(500).optional(),
});

/**
 * Manual promotion workflow — never auto-publishes from sensor ingest.
 */
export async function POST(req: Request) {
  if (!mapableGaisFlags.telemetryEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_TELEMETRY_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = promoteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.toState === "received") {
    return jsonError("Cannot promote to received", 400);
  }

  const existing = getObservation(parsed.data.observationId);
  if (!existing) return jsonError("Observation not found", 404);

  // Only the ingesting user (or future admin path) may promote — no public identity leak.
  if (existing.ingestedByUserId && existing.ingestedByUserId !== user.id) {
    return jsonError("Not authorised to promote this observation", 403);
  }

  const result = transitionObservationPromotion({
    observationId: parsed.data.observationId,
    toState: parsed.data.toState,
  });

  if (!result.ok) return jsonError(result.error, 400);

  return jsonOk({
    observation: toPublicObservation(result.observation),
    meta: {
      ...GAIS_RESPONSE_META,
      verificationState: result.observation.verificationState,
      autoVerified: false,
      note:
        result.observation.promotionState === "published"
          ? "Published candidate still carries SENSOR_OBSERVED — not independently VERIFIED."
          : "Promotion advanced one workflow step. Sensor data never auto-verifies.",
    },
  });
}
