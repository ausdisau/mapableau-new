import {
  CIVIC_DISABLED_CODE,
  isCivicEnabled,
  isCivicFlagEnabled,
  type CivicFeatureFlag,
} from "./feature-flags";

export function civicDisabledResponse() {
  return Response.json(
    {
      error: "MapAble Civic is disabled",
      code: CIVIC_DISABLED_CODE,
    },
    { status: 404 }
  );
}

export function requireCivicFlag(flag: CivicFeatureFlag): Response | null {
  if (!isCivicEnabled() || !isCivicFlagEnabled(flag)) {
    return civicDisabledResponse();
  }
  return null;
}

export function mapCivicError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHORIZED") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (message === "FORBIDDEN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (message === "MAPABLE_CIVIC_DISABLED" || message === "CIVIC_DISABLED") {
    return civicDisabledResponse();
  }
  if (
    message === "ASSET_NOT_FOUND" ||
    message === "SOURCE_NOT_FOUND" ||
    message === "LICENCE_REQUIRED"
  ) {
    return Response.json({ error: message }, { status: 404 });
  }
  if (
    message === "ASSET_STABLE_KEY_CONFLICT" ||
    message === "SOURCE_STABLE_KEY_CONFLICT" ||
    message === "EXTERNAL_REF_CONFLICT"
  ) {
    return Response.json({ error: message }, { status: 409 });
  }
  if (message.startsWith("CIVIC_INVARIANT_VIOLATION")) {
    return Response.json({ error: message }, { status: 422 });
  }
  return Response.json({ error: message }, { status: 400 });
}
