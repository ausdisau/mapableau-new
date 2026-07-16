import { createDemoPassports } from "@/lib/access-intelligence/demo-data";
import type { AccessPassport } from "@/lib/access-intelligence/schemas";

import {
  isPhysicalSystemsError,
  PhysicalSystemsError,
} from "./errors";

export function resolvePhysicalPassport(
  userId: string,
  passportId?: string,
): AccessPassport {
  const list = createDemoPassports(userId);
  const passport =
    (passportId ? list.find((p) => p.id === passportId) : undefined) ??
    list.find((p) => p.isDefault) ??
    list[0];
  if (!passport) {
    throw new PhysicalSystemsError(
      "VALIDATION_ERROR",
      "No Access Passport is available for physical planning.",
    );
  }
  return passport;
}

export function physicalErrorResponse(error: unknown): Response {
  if (isPhysicalSystemsError(error)) {
    const status =
      error.code === "UNAUTHORISED"
        ? 401
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "ACTION_NOT_FOUND" ||
              error.code === "CAPABILITY_NOT_FOUND"
            ? 404
            : error.code === "VALIDATION_ERROR"
              ? 400
              : 400;
    return Response.json(error.toPublicJson(), { status });
  }
  console.error("[physical-systems]", error);
  return Response.json(
    {
      error: "Physical Systems request failed.",
      code: "EXECUTION_FAILED",
      recoveryHint: "Retry once, then use staff assistance if it persists.",
    },
    { status: 503 },
  );
}
