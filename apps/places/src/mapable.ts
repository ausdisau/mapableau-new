import type { Place } from "./domain";

/**
 * The existing MapAble route GET /api/access/places returns published places.
 * Fetch only with explicit public base configuration. No device coordinates,
 * account identifiers, disability preferences or place memories are sent.
 */
const BASE = (process.env.EXPO_PUBLIC_MAPABLE_API_URL ?? "").trim().replace(/\/+$/, "");

export function isMapAbleReadConfigured(): boolean {
  return /^https:\/\/[^/\s]+$/i.test(BASE) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(BASE);
}

export function parseMapAbleDirectoryResponse(raw: unknown, sourceUrl: string, today: string): Place[] {
  if (!raw || typeof raw !== "object") throw new Error("Unexpected MapAble places response");
  const entries = (raw as { places?: unknown }).places;
  if (!Array.isArray(entries)) throw new Error("MapAble places payload is missing");
  const result: Place[] = [];
  const ids = new Set<string>();
  for (const value of entries.slice(0, 100)) {
    if (!value || typeof value !== "object") continue;
    const p = value as Record<string, unknown>;
    if (typeof p.id !== "string" || p.id.length > 100 ||
        typeof p.name !== "string" || !p.name.trim() || p.name.length > 160 ||
        ids.has(p.id)) continue;
    const suburb = typeof p.suburb === "string" ? p.suburb.slice(0, 120) : "Location not specified";
    ids.add(p.id);
    result.push({
      id: "mapable:" + p.id,
      name: p.name.trim(), suburb,
      category: typeof p.category === "string" ? p.category.replace(/_/g, " ").slice(0, 80) : "Place",
      description: "Published in the MapAble place directory. Review the full evidence before planning access.",
      source: "mapable-directory",
      sourceLabel: "MapAble published place record",
      sourceReviewedAt: today,
      sourceUrl,
      stepFree: {
        status: "unknown",
        detail: "This brief directory response does not include sufficient verified entrance measurements.",
      },
      accessibleToilet: {
        status: "unknown",
        detail: "This brief directory response does not establish accessible-toilet suitability.",
      },
      caution: "A published place is not an accessibility guarantee. Open MapAble for detailed observations and check current conditions.",
    });
    if (result.length >= 50) break;
  }
  return result;
}

export async function fetchMapAblePublishedPlaces(): Promise<Place[]> {
  if (!isMapAbleReadConfigured()) return [];
  const url = BASE + "/api/access/places";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("MapAble places service unavailable");
    const raw: unknown = await response.json();
    return parseMapAbleDirectoryResponse(
      raw, BASE + "/access", new Date().toISOString().slice(0, 10),
    );
  } finally {
    clearTimeout(timer);
  }
}
