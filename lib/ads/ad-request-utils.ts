import { createHash, randomUUID } from "crypto";

export const AD_SESSION_COOKIE = "mapable_ad_session";

export function getOrCreateAdSessionToken(existing?: string | null): string {
  if (existing && existing.length >= 16) return existing;
  return createHash("sha256")
    .update(`${randomUUID()}-${Date.now()}`)
    .digest("hex")
    .slice(0, 32);
}

export function parseViewportFromSearchParams(
  searchParams: URLSearchParams,
): { north: number; south: number; east: number; west: number } | undefined {
  const north = Number(searchParams.get("north"));
  const south = Number(searchParams.get("south"));
  const east = Number(searchParams.get("east"));
  const west = Number(searchParams.get("west"));
  if ([north, south, east, west].some((n) => Number.isNaN(n))) return undefined;
  return { north, south, east, west };
}

export function parseCsvParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
