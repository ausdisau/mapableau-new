import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { findNearbyOperatorOrganisations } from "@/lib/geo/postgis";
import { requireTransportApi } from "@/lib/modules/module-api-auth";

const querySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusKm: z.coerce.number().min(1).max(200).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  const auth = await requireTransportApi();
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    radiusKm: url.searchParams.get("radiusKm") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const operators = await findNearbyOperatorOrganisations({
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    radiusKm: parsed.data.radiusKm,
    limit: parsed.data.limit,
  });

  return jsonOk({ operators });
}
