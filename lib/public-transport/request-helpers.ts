import { resolveJurisdiction } from "@/lib/public-transport/jurisdiction";
import type { PtJurisdiction } from "@/lib/public-transport/types";

export function resolvePtJurisdictionFromRequest(params: {
  jurisdiction?: string | null;
  lat?: number | null;
  lng?: number | null;
}): PtJurisdiction {
  const resolved = resolveJurisdiction(params);
  if (!resolved) {
    throw new Error("Could not determine public transport jurisdiction. Provide jurisdiction or lat/lng.");
  }
  return resolved;
}

export function parseOptionalNumber(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export function parseOptionalBoolean(value: string | null): boolean | undefined {
  if (value == null || value === "") return undefined;
  return value === "true" || value === "1";
}
