import type { GeocodeResult } from "@/lib/map/geocoding-service";

export type GeocodeApiResponse = {
  results: GeocodeResult[];
};

export class GeocodeClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GeocodeClientError";
  }
}

/** Resolve a suburb/postcode/address string via MapAble's geocoding API. */
export async function fetchGeocode(
  query: string,
  options?: { limit?: number; country?: string },
): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  const params = new URLSearchParams({ q, limit: String(options?.limit ?? 1) });
  if (options?.country) {
    params.set("country", options.country);
  }

  const res = await fetch(`/api/geocode?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Geocoding failed";
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new GeocodeClientError(message, res.status);
  }

  const data = (await res.json()) as GeocodeApiResponse;
  return data.results[0] ?? null;
}
