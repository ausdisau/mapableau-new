import type { Prisma } from "@prisma/client";

/**
 * Prisma's JSON input types are strict. When we accept a
 * `Record<string, unknown>` from a caller (Zod-validated or otherwise) we
 * need to hand it over as `Prisma.InputJsonValue`. This helper is a single
 * explicit cast site so we can grep for JSON handoffs in one place.
 */
export function asJson(
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return value as unknown as Prisma.InputJsonValue;
}

export function asNullableJson(
  value: Record<string, unknown> | null | undefined
):
  | Prisma.NullableJsonNullValueInput
  | Prisma.InputJsonValue
  | undefined {
  if (value === null) return undefined;
  if (value === undefined) return undefined;
  return value as unknown as Prisma.InputJsonValue;
}

export function asJsonArray(
  value: unknown[] | null | undefined
): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return value as unknown as Prisma.InputJsonValue;
}
