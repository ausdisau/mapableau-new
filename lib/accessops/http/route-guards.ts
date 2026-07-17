import { ZodError, type ZodSchema } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import type { CurrentUser } from "@/lib/auth/current-user";

import { isAccessOpsFeatureEnabled } from "../feature-flags";
import type { AccessOpsFeatureFlagKey } from "../types";

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  mapable_admin: ["accessops:*"],
  provider_admin: [
    "accessops:read_restricted",
    "accessops:manage_assets",
    "accessops:manage_status",
    "accessops:manage_incidents",
    "accessops:manage_sensors",
    "accessops:manage_webhooks",
  ],
  transport_operator: [
    "accessops:read_restricted",
    "accessops:manage_status",
    "accessops:manage_incidents",
  ],
  support_coordinator: ["accessops:read_public"],
};

export const DEFAULT_ACCESSOPS_BODY_LIMIT_BYTES = 256 * 1024;

export function accessOpsJson<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function accessOpsError(
  code: string,
  message: string,
  status = 400,
): Response {
  return Response.json({ error: { code, message } }, { status });
}

export function accessOpsZodError(error: ZodError): Response {
  return Response.json(
    { error: { code: "VALIDATION_ERROR", details: error.flatten() } },
    { status: 400 },
  );
}

export async function requireAccessOpsSession(): Promise<
  CurrentUser | Response
> {
  return requireApiSession();
}

export async function requireAccessOpsPermission(
  permission: string,
): Promise<CurrentUser | Response> {
  const user = await requireAccessOpsSession();
  if (user instanceof Response) return user;
  if (!hasAccessOpsPermission(user, permission)) {
    return accessOpsError("FORBIDDEN", "AccessOps permission required.", 403);
  }
  return user;
}

export function hasAccessOpsPermission(
  user: CurrentUser,
  permission: string,
): boolean {
  return user.roles.some((role) => {
    const allowed = ROLE_PERMISSIONS[role] ?? [];
    return allowed.includes("accessops:*") || allowed.includes(permission);
  });
}

export function requireAccessOpsFeatureFlag(
  key: AccessOpsFeatureFlagKey,
): Response | null {
  if (isAccessOpsFeatureEnabled(key)) return null;
  return accessOpsError(
    "ACCESSOPS_FEATURE_DISABLED",
    `${key} is disabled in this environment.`,
    404,
  );
}

export function readIdempotencyKey(request: Request): string | null {
  return (
    request.headers.get("idempotency-key") ??
    request.headers.get("x-idempotency-key")
  );
}

export function enforceContentLengthLimit(
  request: Request,
  maxBytes = DEFAULT_ACCESSOPS_BODY_LIMIT_BYTES,
): Response | null {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return null;
  const parsed = Number(contentLength);
  if (!Number.isFinite(parsed) || parsed <= maxBytes) return null;
  return accessOpsError(
    "PAYLOAD_TOO_LARGE",
    `Payload exceeds ${maxBytes} bytes.`,
    413,
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
  maxBytes = DEFAULT_ACCESSOPS_BODY_LIMIT_BYTES,
): Promise<{ data: T } | { response: Response }> {
  const sizeError = enforceContentLengthLimit(request, maxBytes);
  if (sizeError) return { response: sizeError };
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { response: accessOpsZodError(parsed.error) };
  return { data: parsed.data };
}

export async function accessOpsSafe<T>(
  action: () => Promise<T>,
): Promise<Response> {
  try {
    return accessOpsJson(await action());
  } catch (error) {
    const message = error instanceof Error ? error.message : "ACCESSOPS_ERROR";
    return accessOpsError("ACCESSOPS_ERROR", message, 400);
  }
}
