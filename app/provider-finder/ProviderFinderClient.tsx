"use client";

import React from "react";
import { Bookmark, Loader2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProviderFinderAccessLayer } from "@/components/provider-finder/ProviderFinderAccessLayer";
import { ProviderFinderAskPanel } from "@/components/provider-finder/ProviderFinderAskPanel";
import { ProviderFinderHero } from "@/components/provider-finder/ProviderFinderHero";
import { ProviderFinderResultCard } from "@/components/provider-finder/ProviderFinderResultCard";
import { ProviderFinderSidebar } from "@/components/provider-finder/ProviderFinderSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  distanceKm,
  getLocationAndPostcode,
  type UserPosition,
} from "@/lib/geo";
import { trackProductEvent } from "@/lib/analytics/product-analytics";
import { useProactiveChipSuggestions } from "@/lib/hooks/use-proactive-chip-suggestions";
import {
  ACCESS_NEEDS,
  SUPPORT_TYPES,
  type SupportTypeId,
} from "@/lib/provider-finder/filters";
import {
  applyInterpretationToFields,
  buildFinderSearchParams,
} from "@/lib/search/apply-interpretation";
import { getProviderFinderMapSourceClient } from "@/lib/config/provider-finder-map";
import {
  supportAreaLandingRoutes,
  supportAreaToSupportTypeId,
} from "@/lib/marketing/mapable-care-routes";
import { fetchProviderMapPins } from "@/lib/provider-finder/fetch-map-pins";
import { useProviderOutlets } from "@/lib/use-provider-outlets";

import { mapOutletsToProviders } from "./outletToProvider";
import { type Provider } from "./providers";

import type { MapLibreProvider } from "@/components/map/MapLibreMap";

const MapLibreMap = dynamic(
  () =>
    import("@/components/map/MapLibreMap").then((m) => ({
      default: m.MapLibreMap,
    })),
  { ssr: false }
);

type SortMode = "relevance" | "distance" | "rating";

const RADIUS_KM = 50;
const MAP_PIN_LIMIT = 500;

function scoreRelevance(provider: Provider, queryRaw: string) {
  const query = queryRaw.trim().toLowerCase();
  if (!query) return 0;

  const haystack = [
    provider.name,
    provider.suburb,
    provider.state,
    provider.postcode,
    ...provider.categories,
    ...provider.supports,
  ]
    .join(" ")
    .toLowerCase();

  const name = provider.name.toLowerCase();
  if (name.startsWith(query)) return 100;
  const words = query.split(/\s+/).filter(Boolean);
  const wordHits = words.reduce(
    (acc, w) => acc + (haystack.includes(w) ? 1 : 0),
    0,
  );
  const substring = haystack.includes(query) ? 1 : 0;
  return wordHits * 10 + substring * 5;
}

function providerHaystack(provider: Provider) {
  return [
    provider.name,
    provider.suburb,
    provider.state,
    provider.postcode,
    ...provider.categories,
    ...provider.supports,
  ]
    .join(" ")
    .toLowerCase();
}

function hasAppliedSearchCriteria(fields: {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
  supportType: SupportTypeId;
  accessNeeds: string[];
}) {
  return Boolean(
    fields.query.trim() ||
      fields.location.trim() ||
      fields.providerName.trim() ||
      fields.serviceQuery.trim() ||
      fields.accessQuery.trim() ||
      fields.supportType !== "all" ||
      fields.accessNeeds.length > 0,
  );
}

export default function ProviderFinderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: outlets, isLoading, isError, error } = useProviderOutlets();
  const providers = useMemo(
    () => (outlets ? mapOutletsToProviders(outlets) : []),
    [outlets],
  );
  const { suggestions: starterPrompts } =
    useProactiveChipSuggestions("provider_finder");

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [providerName, setProviderName] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [accessQuery, setAccessQuery] = useState("");
  const [supportType, setSupportType] = useState<SupportTypeId>("all");
  const [accessNeeds, setAccessNeeds] = useState<string[]>([]);
  const [funding, setFunding] = useState<"all" | "ndis" | "private">("all");
  const [sort, setSort] = useState<SortMode>("relevance");
  const [page, setPage] = useState(1);
  const [userLocation, setUserLocation] = useState<UserPosition | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [interpretNote, setInterpretNote] = useState<string | null>(null);
  const [ndisMapPins, setNdisMapPins] = useState<MapLibreProvider[] | null>(
    null,
  );
  const [mapPinsLoading, setMapPinsLoading] = useState(false);
  const [askInitialMessage, setAskInitialMessage] = useState<string | undefined>();

  const guidedSessionId = searchParams.get("sessionId");
  const mapSource = getProviderFinderMapSourceClient();
  const pageSize = 12;

  const hasSearchCriteria = hasAppliedSearchCriteria({
    query,
    location,
    providerName,
    serviceQuery,
    accessQuery,
    supportType,
    accessNeeds,
  });

  const dialogueSession = useMemo(
    () => ({
      query,
      location,
      providerName,
      serviceQuery,
      accessQuery,
    }),
    [query, location, providerName, serviceQuery, accessQuery],
  );

  useEffect(() => {
    const area = searchParams.get("area");
    if (area === "Places") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("area");
      const qs = params.toString();
      router.replace(
        qs ? `${supportAreaLandingRoutes.Places}?${qs}` : supportAreaLandingRoutes.Places,
      );
      return;
    }

    const q = searchParams.get("q");
    const loc = searchParams.get("location");
    const access = searchParams.get("access");
    const service = searchParams.get("service");
    const provider = searchParams.get("provider");
    const support = searchParams.get("supportType");
    const accessNeedsParam = searchParams.get("accessNeeds");

    const areaSupportType = supportAreaToSupportTypeId(area);
    if (areaSupportType && !support) {
      setSupportType(areaSupportType);
    }

    if (q) setQuery(q);
    if (loc) setLocation(loc);
    if (access) setAccessQuery(access);
    if (service) setServiceQuery(service);
    if (provider) {
      const name = provider.replace(/-/g, " ");
      setProviderName(name);
      setAskInitialMessage(`Tell me about ${name}`);
    }
    if (support) setSupportType(support as SupportTypeId);
    if (accessNeedsParam) {
      setAccessNeeds(accessNeedsParam.split(",").filter(Boolean));
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#ask-panel") return;
    requestAnimationFrame(() => {
      document.getElementById("ask-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [searchParams]);

  const syncUrlFromFields = useCallback(() => {
    const params = buildFinderSearchParams({
      query,
      location,
      providerName,
      serviceQuery,
      accessQuery,
      supportType: supportType !== "all" ? supportType : null,
      accessNeedIds: accessNeeds,
    });
    if (guidedSessionId) {
      params.set("sessionId", guidedSessionId);
    }
    const qs = params.toString();
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        qs ? `/provider-finder?${qs}` : "/provider-finder",
      );
    }
  }, [
    accessNeeds,
    accessQuery,
    guidedSessionId,
    location,
    providerName,
    query,
    serviceQuery,
    supportType,
  ]);

  const useMyLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { position, postcode } = await getLocationAndPostcode();
      setUserLocation(position);
      setLocation(postcode);
      setPage(1);
      syncUrlFromFields();
    } catch (e) {
      setLocationError(
        e instanceof Error ? e.message : "Could not get your location",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const providerQ = providerName.trim().toLowerCase();
    const serviceQ = serviceQuery.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    const support = SUPPORT_TYPES.find((t) => t.id === supportType);

    const filtered = providers.filter((p) => {
      if (funding === "ndis" && !p.registered) return false;
      if (funding === "private" && p.registered) return false;

      if (support && support.id !== "all") {
        const matchesCategory = support.categories.some((c) =>
          p.categories.includes(c),
        );
        if (!matchesCategory) return false;
      }

      if (accessNeeds.length > 0) {
        const haystack = providerHaystack(p);
        const matchesAccess = accessNeeds.every((needId) => {
          const need = ACCESS_NEEDS.find((n) => n.id === needId);
          if (!need) return true;
          return need.keywords.some((kw) => haystack.includes(kw));
        });
        if (!matchesAccess) return false;
      }

      if (loc) {
        const locHaystack =
          `${p.suburb} ${p.state} ${p.postcode}`.toLowerCase();
        if (!locHaystack.includes(loc)) return false;
      }

      if (q && !providerHaystack(p).includes(q)) return false;
      if (providerQ && !p.name.toLowerCase().includes(providerQ)) return false;
      if (serviceQ) {
        const hay = providerHaystack(p);
        if (!hay.includes(serviceQ)) return false;
      }
      if (accessQuery.trim()) {
        const accessQ = accessQuery.trim().toLowerCase();
        if (!providerHaystack(p).includes(accessQ)) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      if (sort === "rating") return b.rating - a.rating;
      const sa = scoreRelevance(a, query);
      const sb = scoreRelevance(b, query);
      if (sb !== sa) return sb - sa;
      return a.name.localeCompare(b.name);
    });
  }, [
    accessNeeds,
    accessQuery,
    funding,
    location,
    providerName,
    providers,
    query,
    serviceQuery,
    sort,
    supportType,
  ]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visible = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [currentPage, filteredSorted]);

  const outletMapPins = useMemo((): MapLibreProvider[] => {
    let list = filteredSorted;
    if (userLocation) {
      list = list.filter((p) => {
        if (p.latitude == null || p.longitude == null) return false;
        const d = distanceKm(
          userLocation.lat,
          userLocation.lng,
          p.latitude,
          p.longitude,
        );
        return d <= RADIUS_KM;
      });
    }
    return list
      .filter((p) => p.latitude != null && p.longitude != null)
      .slice(0, MAP_PIN_LIMIT)
      .map((p) => ({
        id: p.id,
        name: p.name,
        suburb: p.suburb,
        state: p.state,
        lat: p.latitude!,
        lng: p.longitude!,
        distanceKm: p.distanceKm,
      }));
  }, [filteredSorted, userLocation]);

  useEffect(() => {
    if (
      !hasSearchCriteria ||
      mapSource === "outlets" ||
      (!query.trim() &&
        !location.trim() &&
        !serviceQuery.trim() &&
        !providerName.trim())
    ) {
      setNdisMapPins(null);
      return;
    }

    let cancelled = false;
    setMapPinsLoading(true);
    fetchProviderMapPins({
      q: query,
      location,
      service: serviceQuery,
      provider: providerName,
    })
      .then((res) => {
        if (!cancelled) setNdisMapPins(res.providers);
      })
      .catch(() => {
        if (!cancelled) setNdisMapPins(null);
      })
      .finally(() => {
        if (!cancelled) setMapPinsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasSearchCriteria,
    mapSource,
    query,
    location,
    serviceQuery,
    providerName,
  ]);

  const mapPinProviders = useMemo((): MapLibreProvider[] => {
    const useNdisPins =
      hasSearchCriteria &&
      (mapSource === "ndis" || mapSource === "hybrid") &&
      ndisMapPins &&
      ndisMapPins.length > 0;

    let list = useNdisPins ? ndisMapPins : outletMapPins;

    if (userLocation) {
      list = list
        .map((p) => ({
          ...p,
          distanceKm: distanceKm(
            userLocation.lat,
            userLocation.lng,
            p.lat,
            p.lng,
          ),
        }))
        .filter((p) => (p.distanceKm ?? 0) <= RADIUS_KM);
    }

    return list.slice(0, MAP_PIN_LIMIT);
  }, [
    hasSearchCriteria,
    mapSource,
    ndisMapPins,
    outletMapPins,
    userLocation,
  ]);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  const applyInterpretationFields = (
    applied: ReturnType<typeof applyInterpretationToFields>,
    interpretation: {
      parsed: boolean;
      confidence: number;
      filters: { access: string };
      accessNeeds?: { unmatchedText?: string };
    },
  ) => {
    setQuery(applied.query);
    setLocation(applied.location);
    setProviderName(applied.providerName);
    setServiceQuery(applied.serviceQuery);
    setAccessQuery(applied.accessQuery);
    if (applied.supportType) setSupportType(applied.supportType);
    if (applied.accessNeedIds.length > 0) {
      setAccessNeeds(applied.accessNeedIds);
    }
    const accessUnresolved =
      Boolean(interpretation.filters.access?.trim()) &&
      applied.accessNeedIds.length === 0;
    if (accessUnresolved) {
      setInterpretNote(
        "AI suggested access filters — adjust access needs if something looks off.",
      );
    } else if (interpretation.parsed && interpretation.confidence < 0.6) {
      setInterpretNote(
        "AI-suggested filters — adjust any field if something looks off.",
      );
    } else {
      setInterpretNote(null);
    }
    setPage(1);
    const params = buildFinderSearchParams(applied);
    if (guidedSessionId) {
      params.set("sessionId", guidedSessionId);
    }
    if (typeof window !== "undefined" && params.toString()) {
      window.history.replaceState(
        null,
        "",
        `/provider-finder?${params.toString()}`,
      );
    }
  };

  const handleShowResults = useCallback(() => {
    setPage(1);
    requestAnimationFrame(() => {
      document.getElementById("provider-finder-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const handleAskAboutProvider = useCallback((provider: Provider) => {
    setProviderName(provider.name);
    setAskInitialMessage(`Tell me about ${provider.name}`);
    setPage(1);
    requestAnimationFrame(() => {
      document.getElementById("ask-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const toggleCompare = (provider: Provider) => {
    setCompareIds((prev) =>
      prev.includes(provider.id)
        ? prev.filter((id) => id !== provider.id)
        : [...prev, provider.id].slice(0, 4),
    );
  };

  const locationLabel = location.trim() || "your area";

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <Card variant="outlined" className="p-8 text-center max-w-md">
          <p className="text-muted-foreground">Loading providers…</p>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <Card variant="outlined" className="p-8 text-center max-w-md">
          <h2 className="text-lg font-semibold">Could not load providers</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Something went wrong."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <ProviderFinderHero />
      {interpretNote ? (
        <div className="container mx-auto max-w-7xl px-4 pb-2 pt-2">
          <p className="text-xs text-muted-foreground" role="status">
            {interpretNote}
          </p>
        </div>
      ) : null}

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)] lg:items-start">
          <ProviderFinderAskPanel
            className="sticky top-4 min-h-[28rem] lg:max-h-[calc(100vh-6rem)]"
            session={dialogueSession}
            guidedSessionId={guidedSessionId}
            starterPrompts={[...starterPrompts]}
            initialProviderName={providerName || undefined}
            initialMessage={askInitialMessage}
            onInterpretation={({ interpretation, applied }) => {
              applyInterpretationFields(applied, interpretation);
              trackProductEvent("search_query_interpreted", {
                context: "provider_finder_ask",
                parsed: interpretation.parsed,
                confidence: interpretation.confidence,
                service_category_slug:
                  interpretation.serviceCategorySlug ?? "",
                engine_id: interpretation.engineId,
              });
            }}
            onShowResults={handleShowResults}
          />

          <div
            id="provider-finder-results"
            className="min-w-0 scroll-mt-24"
          >
            {!hasSearchCriteria ? (
              <Card variant="outlined" className="flex min-h-[20rem] flex-col items-center justify-center p-8 text-center">
                <h2 className="font-heading text-xl font-semibold">
                  Your results will appear here
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Describe what you need in chat — support type, location, access
                  needs, or a specific provider — and matching providers will
                  show on the map and list.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-8 lg:flex-row">
                <div className="lg:w-56 xl:w-64">
                  <ProviderFinderSidebar
                    supportType={supportType}
                    onSupportTypeChange={(id) => {
                      setSupportType(id);
                      setPage(1);
                      syncUrlFromFields();
                    }}
                    accessNeeds={accessNeeds}
                    onAccessNeedsChange={(ids) => {
                      setAccessNeeds(ids);
                      setPage(1);
                      syncUrlFromFields();
                    }}
                    funding={funding}
                    onFundingChange={(id) => {
                      setFunding(id);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">
                        {total} matched provider{total === 1 ? "" : "s"}
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                        Showing results near {locationLabel}.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void useMyLocation()}
                        disabled={locationLoading}
                      >
                        {locationLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <MapPin className="h-4 w-4" aria-hidden />
                        )}
                        Use my location
                      </Button>
                      <label className="sr-only" htmlFor="provider-sort">
                        Sort results
                      </label>
                      <select
                        id="provider-sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortMode)}
                        className="min-h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="distance">Distance</option>
                        <option value="rating">Rating</option>
                      </select>
                    </div>
                  </div>

                  {locationError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {locationError}
                    </p>
                  ) : null}

                  {compareIds.length > 0 ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bookmark className="h-4 w-4 text-primary" aria-hidden />
                      {compareIds.length} provider{compareIds.length === 1 ? "" : "s"}{" "}
                      selected to compare
                    </p>
                  ) : null}

                  <section id="map" className="scroll-mt-24">
                    {!userLocation && filteredSorted.length > MAP_PIN_LIMIT ? (
                      <Card variant="outlined" className="mb-4 p-4">
                        <p className="text-sm text-muted-foreground">
                          Set a location or use &quot;Use my location&quot; to see
                          providers on the map.
                        </p>
                      </Card>
                    ) : null}
                    <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
                      {mapPinsLoading ? (
                        <p className="p-4 text-sm text-muted-foreground">
                          Loading map pins…
                        </p>
                      ) : null}
                      <MapLibreMap
                        providers={mapPinProviders}
                        userPosition={userLocation}
                        selectedProviderId={selectedProvider?.id ?? null}
                        onProviderSelect={(id) => {
                          const fromList = filteredSorted.find((x) => x.id === id);
                          if (fromList) setSelectedProvider(fromList);
                        }}
                      />
                    </div>
                  </section>

                  {total === 0 ? (
                    <Card variant="outlined" className="p-8 text-center">
                      <h3 className="text-lg font-semibold">No providers found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Try broadening your search or removing a filter.
                      </p>
                    </Card>
                  ) : (
                    <ul className="space-y-4">
                      {visible.map((p) => (
                        <li key={p.id}>
                          <ProviderFinderResultCard
                            provider={p}
                            isSelected={selectedProvider?.id === p.id}
                            isCompared={compareIds.includes(p.id)}
                            onSelect={setSelectedProvider}
                            onToggleCompare={toggleCompare}
                            onAskAboutProvider={handleAskAboutProvider}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {totalPages > 1 ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <ProviderFinderAccessLayer
                  providers={filteredSorted}
                  selectedId={selectedProvider?.id}
                  onSelect={setSelectedProvider}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
