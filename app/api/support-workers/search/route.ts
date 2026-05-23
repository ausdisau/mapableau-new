import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { searchSupportWorkers } from "@/lib/matching/support-worker-matching";
import {
  parseCommaList,
  supportSearchQuerySchema,
} from "@/lib/validation/support-workers";
import type { SupportRequest, SupportType } from "@/types/support-workers";

export async function GET(req: Request) {
  const user = await requireApiPermission("support_workers:search");
  if (user instanceof Response) return user;

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const query = supportSearchQuerySchema.parse(params);

    let participantId = user.id;
    if (query.participant_id) {
      if (
        !isAdminRole(user.primaryRole) &&
        user.primaryRole !== "support_coordinator" &&
        query.participant_id !== user.id
      ) {
        return jsonError("Forbidden", 403);
      }
      participantId = query.participant_id;
    }

    if (!query.support_type || !query.starts_at || !query.ends_at) {
      return jsonError(
        "support_type, starts_at, and ends_at are required for search",
        400
      );
    }

    const request: SupportRequest = {
      supportType: query.support_type as SupportType,
      startsAt: query.starts_at,
      endsAt: query.ends_at,
      lat: query.lat,
      lng: query.lng,
      requiredCapabilities: parseCommaList(query.required_capabilities),
      communicationModes: parseCommaList(query.communication_modes),
      languages: parseCommaList(query.languages),
      preferredGender: query.preferred_gender,
      maxDistanceKm: query.max_distance_km,
    };

    const result = await searchSupportWorkers(request, participantId);
    const take = query.take ?? 20;
    const skip = query.skip ?? 0;
    const workers = result.workers.slice(skip, skip + take);

    return jsonOk({
      workers,
      total: result.total,
      filtersApplied: result.filtersApplied,
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Search failed", 500);
  }
}
