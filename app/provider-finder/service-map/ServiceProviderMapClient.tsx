"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { MapLibreProvider } from "@/components/map/MapLibreMap";
import ProviderChatStream from "./ProviderChatStream";
import { fetchProviderMapPins } from "@/lib/provider/finder/fetch-map-pins";

const ProviderMap = dynamic(
  () => import("@/components/map/MapLibreMap").then((module) => module.MapLibreMap),
  { ssr: false, loading: () => <p role="status">Loading map…</p> },
);

type MapResponse = Awaited<ReturnType<typeof fetchProviderMapPins>>;

const DEFAULT_LIMIT = 500;

function downloadGeoJson(providers: MapLibreProvider[]) {
  const geojson = {
    type: "FeatureCollection" as const,
    features: providers.map((provider) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [provider.lng, provider.lat],
      },
      properties: {
        id: provider.id,
        name: provider.name,
        suburb: provider.suburb,
        state: provider.state,
        source: "ndis_providers",
        registrationStatus: "not_independently_reverified",
        workerScreeningStatus: "not_publicly_verifiable",
      },
    })),
  };
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "application/geo+json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mapable-provider-locations.geojson";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ServiceProviderMapClient() {
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");
  const [provider, setProvider] = useState("");
  const [filters, setFilters] = useState({ location: "", service: "", provider: "" });
  const [response, setResponse] = useState<MapResponse | null>(null);
  const [chatPins, setChatPins] = useState<MapLibreProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({ limit: String(DEFAULT_LIMIT) });
    if (filters.location) query.set("location", filters.location);
    if (filters.service) query.set("service", filters.service);
    if (filters.provider) query.set("q", filters.provider);
    fetch(`/api/providers/map?${query.toString()}`, { signal: controller.signal })
      .then(async (result) => {
        if (!result.ok) throw new Error(`Provider lookup returned ${result.status}`);
        return (await result.json()) as MapResponse;
      })
      .then((data) => {
        setResponse(data);
        setSelected(null);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setResponse(null);
        setError(reason instanceof Error ? reason.message : "Provider locations could not be loaded");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  const providers = useMemo(
    () => (response?.providers ?? []).filter((item) =>
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lng) &&
      Math.abs(item.lat) <= 90 &&
      Math.abs(item.lng) <= 180,
    ),
    [response],
  );

  const handleChatMapResults = useCallback((pins: MapLibreProvider[]) => {
    setChatPins(pins);
  }, []);
  const mappedProviders = chatPins.length > 0 ? chatPins : providers;

  const onSearch = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      location: location.trim(),
      service: service.trim(),
      provider: provider.trim(),
    });
  }, [location, service, provider]);

  return (
    <main className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Disability care and support provider map</h1>
        <p>Explore provider locations from MapAble's existing NDIS provider dataset. An address pin is not proof of current registration, service availability, accessibility, quality, or an individual worker's screening clearance.</p>
      </header>
      <form onSubmit={onSearch} aria-label="Filter provider locations" className="grid gap-3 rounded-xl border p-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Location, postcode or state
          <input className="rounded-md border bg-background p-2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. NSW or 2075" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Support service
          <input className="rounded-md border bg-background p-2" value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g. support coordination" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Provider name
          <input className="rounded-md border bg-background p-2" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Optional" />
        </label>
        <button type="submit" disabled={loading} className="self-end rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">Search providers</button>
      </form>
      <ProviderChatStream onMapResults={handleChatMapResults} />
      <section aria-label="Provider location search results" className="space-y-3">
        <p role="status" aria-live="polite">
          {loading ? "Loading provider locations…" : error ? "Provider lookup failed." : `${providers.length} locations plotted${response && response.count > providers.length ? ` (first ${providers.length} of ${response.count} matches)` : ""}.`}
        </p>
        {error && <p role="alert" className="text-destructive">{error}. Check the source import and try again.</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={!providers.length} onClick={() => downloadGeoJson(providers)} className="rounded-md border px-4 py-2 disabled:opacity-50">
            Download GeoJSON for OSM / Leaflet
          </button>
          <a href="/provider-finder" className="rounded-md border px-4 py-2 underline">Full provider finder</a>
        </div>
        <p className="text-sm text-muted-foreground">Source: locally ingested NDIS Provider Finder records, not a live regulatory lookup. Individual worker screening is not publicly searchable. Confirm registration against the NDIS Commission Provider Register and screen individual workers through an authorised NDIS Worker Screening Database pathway.</p>
        {mappedProviders.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">{chatPins.length > 0 ? "Map showing current chat results with coordinates." : "Map showing directory filter results."}</p>
            <ProviderMap providers={mappedProviders} fitToProviders={chatPins.length > 0} selectedProviderId={selected} onProviderSelect={setSelected} />
          </>
        ) : !loading && !error ? (
          <p>No geocoded provider locations matched. Try a wider search or use the full provider finder.</p>
        ) : null}
      </section>
      <section aria-labelledby="evidence-heading" className="space-y-2 rounded-xl border p-4">
        <h2 id="evidence-heading" className="text-xl font-semibold">Evidence and safeguarding</h2>
        <p><strong>Provider location:</strong> sourced from imported directory data; check source freshness before relying on a result.</p>
        <p><strong>Provider registration:</strong> not independently reverified by this map. Check the official NDIS Commission Provider Register using ABN or legal name.</p>
        <p><strong>Worker screening:</strong> not independently verified. A provider's registration never proves its workers hold valid clearances. Authorised employers and self-managed participants can use the NDIS Worker Screening Database.</p>
        <p><strong>Access fit:</strong> no accessibility, AAC, complex-support competence, vacancies, fees or funding suitability is inferred from map pins.</p>
        <p>Map tiles and map controls use the existing MapLibre integration. The downloadable GeoJSON is compatible with Leaflet and other OpenStreetMap-based viewers.</p>
      </section>
    </main>
  );
}
