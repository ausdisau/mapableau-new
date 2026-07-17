import type { AccessCurbZoneType } from "@prisma/client";

export interface CurbZoneDto {
  zoneType: AccessCurbZoneType;
  geometryReference: string;
  lprEnabled: false;
}

export function buildCurbZone(
  zoneType: AccessCurbZoneType,
  geometryReference: string,
): CurbZoneDto {
  return { zoneType, geometryReference, lprEnabled: false };
}
