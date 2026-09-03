import type { GaisAccessConditionEvent } from "@/lib/gais/conditions";

export type GaisBoundsInput = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  limit?: number;
};

export type AccessConditionsResponse = {
  layer: string;
  events: GaisAccessConditionEvent[];
  activeAt: string;
  meta: {
    claimState: string;
    evidenceScope: string;
    eventCount: number;
    forecasting: false;
    note: string;
  };
};

export async function fetchAccessConditions(
  input: {
    bounds?: GaisBoundsInput;
    placeId?: string;
    graphId?: string;
    activeAt?: string;
    limit?: number;
  },
  signal?: AbortSignal,
): Promise<AccessConditionsResponse> {
  const params = new URLSearchParams();
  if (input.bounds) {
    params.set("minLat", String(input.bounds.minLat));
    params.set("minLng", String(input.bounds.minLng));
    params.set("maxLat", String(input.bounds.maxLat));
    params.set("maxLng", String(input.bounds.maxLng));
    if (input.bounds.limit) params.set("limit", String(input.bounds.limit));
  }
  if (input.placeId) params.set("placeId", input.placeId);
  if (input.graphId) params.set("graphId", input.graphId);
  if (input.activeAt) params.set("activeAt", input.activeAt);
  if (input.limit) params.set("limit", String(input.limit));

  const res = await fetch(`/api/gais/events?${params.toString()}`, { signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? `Access conditions request failed (${res.status})`);
  }
  return res.json() as Promise<AccessConditionsResponse>;
}
