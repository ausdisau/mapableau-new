import type { JsonObject } from "../types";

export function stripRestrictedGeometry<T extends JsonObject>(
  record: T,
): JsonObject {
  const {
    geometry: _geometry,
    restrictedGeometry: _restrictedGeometry,
    securityGeometry: _securityGeometry,
    ...safe
  } = record;
  if (
    record.securityClassification === "restricted" ||
    record.securityClassification === "security_sensitive"
  ) {
    return safe;
  }
  return { ...safe, geometry: record.geometry };
}
