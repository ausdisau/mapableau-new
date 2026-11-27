import type { MapLibreProvider } from "@/components/map/MapLibreMap";

export type MapPinsResponse = {
  providers: MapLibreProvider[];
  count: number;
  source: "ndis_providers";
};

export async function fetchProviderMapPins(params: {
  q?: string;
  location?: string;
  service?: string;
  provider?: string;
}): Promise<MapPinsResponse> {
  const search = new URLSearchParams();
  if (params.location?.trim()) search.set("location", params.location.trim());
  if (params.service?.trim()) search.set("service", params.service.trim());
  const providerName = params.provider?.trim();
  if (providerName) search.set("q", providerName);

  const res = await fetch(`/api/providers/map?${search.toString()}`);
  if (!res.ok) {
    throw new Error(`Map pins request failed: ${res.status}`);
  }
  return res.json() as Promise<MapPinsResponse>;
}
