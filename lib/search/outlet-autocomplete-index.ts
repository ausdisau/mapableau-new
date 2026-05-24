import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { ProviderOutlet } from "@/data/provider-outlets.types";
import type { AutocompleteSuggestion } from "@/types/search";

type OutletIndex = {
  providers: string[];
  locations: string[];
};

let indexPromise: Promise<OutletIndex> | null = null;
let indexReady = false;

async function loadOutlets(): Promise<ProviderOutlet[]> {
  const path = join(process.cwd(), "public", "data", "provider-outlets.json");
  const raw = await readFile(path, "utf-8");
  const json = JSON.parse(raw) as { data: ProviderOutlet[] };
  return json.data ?? [];
}

async function buildIndex(): Promise<OutletIndex> {
  const outlets = await loadOutlets();
  const providerSet = new Set<string>();
  const locationSet = new Set<string>();

  for (const outlet of outlets) {
    if (outlet.Active !== 1) continue;
    if (outlet.Prov_N?.trim()) providerSet.add(outlet.Prov_N.trim());
    if (outlet.Outletname?.trim() && outlet.Outletname !== outlet.Prov_N) {
      providerSet.add(outlet.Outletname.trim());
    }
    if (outlet.Head_Office?.trim()) locationSet.add(outlet.Head_Office.trim());
  }

  indexReady = true;
  return {
    providers: [...providerSet].sort((a, b) => a.localeCompare(b)),
    locations: [...locationSet].sort((a, b) => a.localeCompare(b)),
  };
}

function getIndex(): Promise<OutletIndex> {
  if (!indexPromise) {
    indexPromise = buildIndex().catch((error) => {
      indexPromise = null;
      throw error;
    });
  }
  return indexPromise;
}

export function isOutletIndexReady(): boolean {
  return indexReady;
}

function prefixMatches(value: string, query: string): boolean {
  const haystack = value.toLowerCase();
  const needle = query.toLowerCase();
  return haystack.includes(needle);
}

export async function searchOutletProviders(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const index = await getIndex();
    return index.providers
      .filter((name) => prefixMatches(name, q))
      .slice(0, limit)
      .map((name, i) => ({
        id: `outlet-provider-${i}-${name.slice(0, 24)}`,
        type: "provider" as const,
        typeLabel: "Provider",
        label: name,
        value: name,
      }));
  } catch {
    return [];
  }
}

export async function searchOutletLocations(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const index = await getIndex();
    return index.locations
      .filter((loc) => prefixMatches(loc, q))
      .slice(0, limit)
      .map((loc, i) => ({
        id: `outlet-location-${i}-${loc.slice(0, 24)}`,
        type: "location" as const,
        typeLabel: "Location",
        label: loc,
        value: loc,
      }));
  } catch {
    return [];
  }
}

/** Warm the outlet index in the background (e.g. on server start). */
export function warmOutletAutocompleteIndex(): void {
  void getIndex().catch(() => {
    /* static fallbacks cover failures */
  });
}
