import {
  ACCESSIBILITY_OPS_DISABLED_CODE,
  isAccessibilityOpsEnabled,
  isAccessibilityOpsFlagEnabled,
  type AccessibilityOpsFeatureFlag,
} from "./feature-flags";

export function opsDisabledResponse() {
  return Response.json(
    {
      error: "AccessibilityOps is disabled",
      code: ACCESSIBILITY_OPS_DISABLED_CODE,
    },
    { status: 404 }
  );
}

export function requireOpsFlag(flag: AccessibilityOpsFeatureFlag): Response | null {
  if (!isAccessibilityOpsEnabled() || !isAccessibilityOpsFlagEnabled(flag)) {
    return opsDisabledResponse();
  }
  return null;
}

export function mapOpsError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "UNAUTHORIZED") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (message === "FORBIDDEN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (message === "ACCESSIBILITY_OPS_DISABLED") {
    return opsDisabledResponse();
  }
  if (message === "ASSET_NOT_FOUND" || message === "RULE_NOT_FOUND") {
    return Response.json({ error: message }, { status: 404 });
  }
  if (
    message === "ASSET_STABLE_KEY_CONFLICT" ||
    message === "RULE_STABLE_KEY_CONFLICT"
  ) {
    return Response.json({ error: message }, { status: 409 });
  }
  return Response.json({ error: message }, { status: 400 });
}
