import type {
  GeoscapeResolvedAddress,
  GeoscapeSuggestItem,
  GeoscapeSuggestResult,
} from "@/types/geoscape-predictive";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function normalizeSuggestResponse(raw: unknown): GeoscapeSuggestResult {
  const root = asRecord(raw);
  const data = asRecord(root?.data) ?? root;
  const suggestRaw = data?.suggest;
  if (!Array.isArray(suggestRaw)) {
    return { suggest: [] };
  }

  const suggest: GeoscapeSuggestItem[] = [];
  for (const item of suggestRaw) {
    const row = asRecord(item);
    if (!row) continue;
    const id = asString(row.id);
    const address = asString(row.address);
    if (!id || !address) continue;
    suggest.push({
      id,
      address,
      rank: asNumber(row.rank),
    });
  }
  return { suggest };
}

/**
 * Normalize Geoscape Get Address payloads.
 * Supports both `{ address: Feature }` and `{ data: { address: Feature } }`.
 */
export function normalizeAddressResponse(
  raw: unknown,
  requestId: string,
): GeoscapeResolvedAddress | null {
  const root = asRecord(raw);
  const data = asRecord(root?.data) ?? root;
  const address = asRecord(data?.address);
  if (!address) return null;

  const properties = asRecord(address.properties) ?? {};
  const geometry = asRecord(address.geometry);
  const coords = Array.isArray(geometry?.coordinates)
    ? geometry.coordinates
    : undefined;

  const formattedAddress =
    asString(properties.formatted_address) ??
    asString(properties.address) ??
    asString(address.address);
  if (!formattedAddress) return null;

  const lng = coords ? asNumber(coords[0]) : undefined;
  const lat = coords ? asNumber(coords[1]) : undefined;

  return {
    id: asString(address.id) ?? requestId,
    gnafId:
      asString(properties.address_identifier) ??
      asString(properties.gnaf_pid) ??
      undefined,
    formattedAddress,
    suburb:
      asString(properties.locality_name) ??
      asString(properties.suburb) ??
      undefined,
    state:
      asString(properties.state_territory) ??
      asString(properties.state) ??
      undefined,
    postcode: asString(properties.postcode),
    lat,
    lng,
  };
}
