import type { MapAbleUserRole } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { coordinateConfig } from "@/lib/config/coordinate";
import type { UserRole } from "@/types/mapable";

import {
  CoordinateAccessError,
  resolveParticipantScope,
} from "./access-service";

export function coordinateModuleDisabledResponse() {
  return jsonError("MapAble Coordinate is not enabled", 404);
}

export async function requireCoordinateApiUser(): Promise<
  CurrentUser | Response
> {
  if (!coordinateConfig.enabled) {
    return coordinateModuleDisabledResponse();
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const role = user.primaryRole as UserRole;
  const allowed =
    hasPermission(role, "coordinate:participant") ||
    hasPermission(role, "coordinate:portal") ||
    hasPermission(role, "coordinate:review") ||
    hasPermission(role, "coordinate:audit:read");

  if (!allowed) {
    return jsonError("Forbidden", 403);
  }

  return user;
}

export function resolveParticipantIdFromRequest(
  user: CurrentUser,
  searchParams: URLSearchParams,
  bodyParticipantId?: string | null,
): string {
  const requested =
    bodyParticipantId ??
    searchParams.get("participantId") ??
    searchParams.get("participant");

  return resolveParticipantScope({
    actorId: user.id,
    actorRole: user.primaryRole as MapAbleUserRole,
    requestedParticipantId: requested,
  });
}

export function handleCoordinateServiceError(error: unknown): Response {
  if (error instanceof CoordinateAccessError) {
    if (error.message === "CONSENT_REQUIRED") {
      return jsonError("Coordinator consent required", 403);
    }
    if (error.message === "PARTICIPANT_ID_REQUIRED") {
      return jsonError("participantId is required", 400);
    }
    return jsonError("Forbidden", 403);
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return jsonError("Not found", 404);
  }
  return jsonError("Request failed", 500);
}
