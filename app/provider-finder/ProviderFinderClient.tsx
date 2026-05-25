"use client";

import { Bookmark, Loader2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MapAbleCareCombinedSections } from "@/components/marketing/MapAbleCareCombinedSections";
import { ProviderFinderAccessLayer } from "@/components/provider-finder/ProviderFinderAccessLayer";
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
import {
  ACCESS_NEEDS,
  SUPPORT_TYPES,
  type SupportTypeId,
} from "@/lib/provider-finder/filters";
import { useProviderOutlets } from "@/lib/use-provider-outlets";

import { mapOutletsToProviders } from "./outletToProvider";
import { type Provider } from "./providers";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

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

export default function ProviderFinderClient() {
  const searchParams = useSearchParams();
  const { data: outlets, isLoading, isError, error } = useProviderOutlets();
  const providers = useMemo(
    () => (outlets ? mapOutletsToProviders(outlets) : []),
    [outlets],
  );

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
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserPosition | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const pageSize = 12;

  useEffect(() => {
    const q = searchParams.get("q");
    const loc = searchParams.get("location");
    const access = searchParams.get("access");
    const service = searchParams.get("service");
    const provider = searchParams.get("provider");

    if (q) {
      setQuery(q);
      setSearchSubmitted(true);
    }
    if (loc) {
      setLocation(loc);
      setSearchSubmitted(true);
    }
    if (access) {
      setAccessQuery(access);
      setSearchSubmitted(true);
    }
    if (service) {
      setServiceQuery(service);
      setSearchSubmitted(true);
    }
    if (provider) {
      setProviderName(provider);
      setSearchSubmitted(true);
    }
  }, [searchParams]);

  const useMyLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { position, postcode } = await getLocationAndPostcode();
      setUserLocation(position);
      setLocation(postcode);
      setPage(1);
      setSearchSubmitted(true);
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

  const handleAccessSuggestionSelect = (label: string) => {
    const match = ACCESS_NEEDS.find(
      (n) =>
        n.label.toLowerCase() === label.toLowerCase() ||
        n.keywords.some((kw) => label.toLowerCase().includes(kw)),
    );
    if (match && !accessNeeds.includes(match.id)) {
      setAccessNeeds((prev) => [...prev, match.id]);
    }
  };

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visible = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [currentPage, filteredSorted]);

  const mapProviders = useMemo(() => {
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
    return list.slice(0, MAP_PIN_LIMIT);
  }, [filteredSorted, userLocation]);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  const handleSearch = () => {
    setSearchSubmitted(true);
    setPage(1);
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSearchSubmitted(true);
    setPage(1);
  };

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
      <ProviderFinderHero
        query={query}
        location={location}
        providerName={providerName}
        serviceQuery={serviceQuery}
        accessQuery={accessQuery}
        onQueryChange={setQuery}
        onLocationChange={setLocation}
        onProviderNameChange={setProviderName}
        onServiceQueryChange={setServiceQuery}
        onAccessQueryChange={setAccessQuery}
        onSearch={handleSearch}
        onSuggestionClick={handleSuggestion}
        onAccessSuggestionSelect={handleAccessSuggestionSelect}
        compact={searchSubmitted}
      />

      {!searchSubmitted ? <MapAbleCareCombinedSections /> : null}

      {searchSubmitted ? (
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="lg:w-56 xl:w-64">
              <ProviderFinderSidebar
                supportType={supportType}
                onSupportTypeChange={(id) => {
                  setSupportType(id);
                  setPage(1);
                }}
                accessNeeds={accessNeeds}
                onAccessNeedsChange={(ids) => {
                  setAccessNeeds(ids);
                  setPage(1);
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
                    onClick={useMyLocation}
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
                  <Map
                    providers={mapProviders}
                    userPosition={userLocation}
                    centerOnProvider={selectedProvider}
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
        </div>
      ) : null}
    </>
  );
}
