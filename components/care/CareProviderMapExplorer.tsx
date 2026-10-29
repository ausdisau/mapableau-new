"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { REG_GROUP_OPTIONS } from "@/app/provider-finder/regGroupOptions";
import {
  CARE_MAP_CENTRES,
  DEFAULT_CARE_MAP_BOUNDS,
  type CareMapBounds,
  type CareMapRegion,
  type CareMapResponse,
} from "@/lib/provider/care-map-contract";

const LeafletCanvas = dynamic(() => import("./CareProviderLeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[540px] items-center justify-center rounded-2xl border border-slate-300 bg-slate-100 p-4"
      role="status"
    >
      Loading the map. Provider results are also available as text.
    </div>
  ),
});

const OFFICIAL_FINDER =
  "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder";
const PROVIDER_REGISTER =
  "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider";
const SCREENING_GUIDANCE =
  "https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-participants";

const REGIONS = [
  ["NSW", "New South Wales"],
  ["VIC", "Victoria"],
  ["QLD", "Queensland"],
  ["WA", "Western Australia"],
  ["SA", "South Australia"],
  ["TAS", "Tasmania"],
  ["ACT", "Australian Capital Territory"],
  ["NT", "Northern Territory"],
  ["ALL", "All Australia"],
] as const;

function dateLabel(date: string | null): string {
  if (!date) return "Not supplied";
  const parsed = new Date(date);
  return Number.isFinite(parsed.getTime())
    ? parsed.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not supplied";
}

function regionLabel(region: CareMapRegion) {
  return REGIONS.find(([key]) => key === region)?.[1] || "Australia";
}

function roundBounds(bounds: CareMapBounds): CareMapBounds {
  return {
    south: Number(bounds.south.toFixed(4)),
    west: Number(bounds.west.toFixed(4)),
    north: Number(bounds.north.toFixed(4)),
    east: Number(bounds.east.toFixed(4)),
  };
}

export function CareProviderMapExplorer() {
  const [region, setRegion] = useState<CareMapRegion>("NSW");
  const [group, setGroup] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [bounds, setBounds] = useState<CareMapBounds>(
    DEFAULT_CARE_MAP_BOUNDS,
  );
  const [data, setData] = useState<CareMapResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const onBoundsChange = useCallback((next: CareMapBounds) => {
    const rounded = roundBounds(next);
    setBounds((previous) => {
      const prior = roundBounds(previous);
      return Object.keys(rounded).every((key) => {
        const field = key as keyof CareMapBounds;
        return prior[field] === rounded[field];
      })
        ? previous
        : rounded;
    });
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    const search = new URLSearchParams({
      south: String(bounds.south),
      west: String(bounds.west),
      north: String(bounds.north),
      east: String(bounds.east),
    });
    if (region !== "ALL") search.set("state", region);
    if (group) search.set("group", group);
    if (query) search.set("q", query);

    setLoading(true);
    setError("");
    setData(null);
    fetch("/api/providers/care-map?" + search.toString(), {
      signal: abort.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as CareMapResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error || "Provider map search failed.");
        }
        return body;
      })
      .then((body) => {
        if (!abort.signal.aborted) setData(body);
      })
      .catch((reason: unknown) => {
        if (!abort.signal.aborted) {
          setError(
            reason instanceof Error ? reason.message : "Map search unavailable.",
          );
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });

    return () => abort.abort();
  }, [bounds, region, group, query, refresh]);

  const providers = useMemo(() => data?.providers ?? [], [data]);
  const selected = providers.find((provider) => provider.id === selectedId);

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_auto]"
        aria-label="Find providers"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(draftQuery.trim());
        }}
      >
        <div>
          <label className="block text-sm font-bold" htmlFor="care-map-region">
            State or territory
          </label>
          <select
            id="care-map-region"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            value={region}
            onChange={(event) =>
              setRegion(event.target.value as CareMapRegion)
            }
          >
            {REGIONS.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold" htmlFor="care-map-group">
            NDIS registration group
          </label>
          <select
            id="care-map-group"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
          >
            <option value="">All service groups</option>
            {REG_GROUP_OPTIONS.map((option) => (
              <option key={option.Index} value={option.RegGroup}>
                {option.RegGroup}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold" htmlFor="care-map-query">
            Provider name or suburb
          </label>
          <input
            id="care-map-query"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 px-3 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            maxLength={120}
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search within the visible map area"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 self-end rounded-lg bg-[#005B7F] px-5 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-slate-700">
        Choose a region, then move or zoom the map to explore provider outlets.
        Results and map pins show the same visible-area records. No device
        location or disability diagnosis is required.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,1fr)]">
        <section aria-labelledby="care-map-heading" className="min-w-0 space-y-3">
          <h2 id="care-map-heading" className="text-xl font-bold">
            Map — {regionLabel(region)}
          </h2>
          <p id="care-map-instructions" className="text-sm text-slate-700">
            Use the plus and minus controls to zoom. Scroll-wheel zoom is off;
            use the provider list for a non-map alternative.
          </p>
          <LeafletCanvas
            providers={providers}
            region={region}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onBoundsChange={onBoundsChange}
          />
          <p className="text-xs text-slate-700">
            Pins represent directory outlet coordinates, not verified service
            areas, home visits or accessible entrances. Map data © OpenStreetMap
            contributors.
          </p>
        </section>

        <section aria-labelledby="care-map-results-heading" className="min-w-0 space-y-3">
          <h2 id="care-map-results-heading" className="text-xl font-bold">
            Provider results
          </h2>
          <p aria-live="polite" role="status" className="text-sm text-slate-700">
            {loading
              ? "Searching this map area…"
              : error
                ? "Provider search unavailable."
                : String(providers.length) +
                  " mapped directory result" +
                  (providers.length === 1 ? "" : "s") +
                  " in this view."}
          </p>
          {error ? (
            <div role="alert" className="rounded-xl border border-amber-600 p-4 text-sm">
              <p>{error}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-slate-500 px-4 font-bold"
                  onClick={() => setRefresh((value) => value + 1)}
                >
                  Retry search
                </button>
                <a
                  className="inline-flex min-h-11 items-center underline"
                  href={OFFICIAL_FINDER}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official NDIS Provider Finder
                </a>
              </div>
            </div>
          ) : null}
          {data?.staleImport ? (
            <p className="rounded-xl border border-amber-600 p-3 text-sm" role="note">
              The last successful directory import was over 45 days ago.
              Listings may be outdated. Check the official register.
            </p>
          ) : null}
          {data?.moreAvailable ? (
            <p role="note" className="rounded-xl border border-slate-400 p-3 text-sm">
              More results exist in this map area than the display limit.
              Zoom in or choose a service group to refine the list.
            </p>
          ) : null}
          {!loading && !error && providers.length === 0 ? (
            <p className="rounded-xl border border-slate-300 p-4 text-sm">
              No mapped records match this view. This does not mean that
              services are unavailable. Try moving the map or using the official
              NDIS Provider Finder.
            </p>
          ) : null}
          <ul
            className="max-h-[540px] space-y-3 overflow-y-auto pr-1"
            aria-label="Provider results in the visible map area"
            aria-busy={loading}
          >
            {providers.map((provider) => {
              const active = selected?.id === provider.id;
              const location = [
                provider.suburb,
                provider.state,
                provider.postcode,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={provider.id}>
                  <article
                    className={
                      "rounded-xl border bg-white p-4 " +
                      (active ? "border-[#005B7F] ring-2 ring-[#005B7F]" : "border-slate-300")
                    }
                  >
                    <h3 className="text-base font-bold">{provider.name}</h3>
                    <p className="mt-1 text-sm">{location || "Location not stated"}</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {provider.registrationGroups.slice(0, 3).join("; ") ||
                        "Registration groups not supplied"}
                    </p>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedId(provider.id)}
                      className="mt-3 min-h-11 rounded-lg border border-[#005B7F] px-4 text-sm font-bold text-[#005B7F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {active ? "Selected on map" : "Show on map"}
                    </button>
                    {active ? (
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">
                        <p>
                          <strong>ABN:</strong> {provider.abn || "Not supplied"}
                        </p>
                        <p>
                          <strong>NDIS source date:</strong>{" "}
                          {dateLabel(provider.sourceUpdatedAt)}
                        </p>
                        <p>
                          <strong>Current registration:</strong> Not
                          independently reverified.
                        </p>
                        <p>
                          <strong>Worker screening:</strong> Not independently
                          verified. No individual worker status is published
                          here.
                        </p>
                        {provider.phone ? (
                          <p>
                            <strong>Phone:</strong>{" "}
                            {provider.phone}
                          </p>
                        ) : null}
                        {provider.website ? (
                          <p>
                            <a
                              href={provider.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Provider website
                            </a>
                          </p>
                        ) : null}
                        <p>
                          Confirm availability, service area, accessibility and
                          individual competencies directly with the provider.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <a href={PROVIDER_REGISTER} target="_blank" rel="noopener noreferrer" className="underline">
                            Check provider registration
                          </a>
                          <a href={SCREENING_GUIDANCE} target="_blank" rel="noopener noreferrer" className="underline">
                            Check worker-screening pathway
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="space-y-2 rounded-2xl border border-slate-300 bg-[#F6FBFC] p-4 text-sm">
        <h2 className="text-base font-bold">About this directory</h2>
        <p>
          Source: imported NDIA Provider Finder directory. Last successful
          import: {dateLabel(data?.importedAt ?? null)}. Registration groups
          describe directory categories, not live availability, quality,
          accessibility or a worker&apos;s screening clearance. MapAble has
          not individually inspected these listings.
        </p>
        <p>
          The available sources support provider-level matching, not individual
          worker verification. A self-managed participant or an authorised
          provider can check worker status through the NDIS Worker Screening
          Database. No confidential worker record is accessed by this map.
        </p>
        <p>
          Use the{" "}
          <a href={OFFICIAL_FINDER} target="_blank" rel="noopener noreferrer" className="underline">
            official NDIS Provider Finder
          </a>{" "}
          and{" "}
          <a href={PROVIDER_REGISTER} target="_blank" rel="noopener noreferrer" className="underline">
            NDIS Commission Provider Register
          </a>{" "}
          to verify current information. Any change or safety concern should be
          raised through the appropriate provider and Commission channels.
        </p>
        <p className="text-xs text-slate-600">
          Map interaction sends only your map bounds and chosen search filters
          to MapAble. Basemap tile requests go to the configured tile provider.
        </p>
      </aside>
      <p className="sr-only">
        Available state centres: {Object.keys(CARE_MAP_CENTRES).join(", ")}.
      </p>
    </div>
  );
}
