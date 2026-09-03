"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LiveRegion } from "@/components/a11y/LiveRegion";
import { AccessExplorationPlaceCard } from "@/components/access/AccessExplorationPlaceCard";
import { AccessFilterPanel } from "@/components/access/AccessFilterPanel";
import { AccessMap } from "@/components/access/AccessMap";
import { AccessSearchBar } from "@/components/access/AccessSearchBar";
import { MobileAccessMapShell } from "@/components/access/MobileAccessMapShell";
import { AccessFitBreakdownV2 } from "@/components/access-fit/AccessFitBreakdownV2";
import { AccessRequirementsPanel } from "@/components/access-fit/AccessRequirementsPanel";
import { QuickObservationDialog } from "@/components/accessibility-map/QuickObservationDialog";
import { MapErrorBoundary } from "@/components/error/MapErrorBoundary";
import { GaisFeatureListPanel } from "@/components/gais/GaisFeatureListPanel";
import { GaisLayerToggle } from "@/components/gais/GaisLayerToggle";
import { useSponsoredMapMarkers } from "@/hooks/ads/useSponsoredMapMarkers";
import type { AccessExplorationPlace } from "@/lib/access/experience/access-exploration-dto";
import {
  LIST_PAGE_PRESENTATION_SIZE,
  MAP_MARKER_PRESENTATION_LIMIT,
  buildExplorationResultIdsFromAccessPlaces,
  listPresentationIds,
  mapPresentationIds,
  orderAccessExplorationPlacesByResultIds,
} from "@/lib/access/experience/exploration-results";
import {
  applyJourneyOverride,
  resolveActiveRequirements,
  setSavedRequirements,
} from "@/lib/access/experience/exploration-state";
import { buildGoHandoffHref, GO_SANDBOX_DISCLAIMER } from "@/lib/access/experience/go-handoff";
import { accessibilityProfileToRequirements } from "@/lib/access/experience/requirement-profile";
import {
  loadExplorationSession,
  saveExplorationSession,
} from "@/lib/access/experience/session-storage";
import { toAccessExplorationPlace } from "@/lib/access/experience/to-access-exploration-place";
import type {
  AccessExplorationState,
  AccessRequirementProfile,
} from "@/lib/access/experience/types";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "@/lib/access/experience/types";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { ACCESS_DISCLAIMER } from "@/lib/access/map/copy";
import { isClientAdsAccessEnabled } from "@/lib/ads/config/client-flags";
import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";
import { isClientGaisLayerEnabled } from "@/lib/gais/client/flags";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type AccessExplorationShellPlaceInput = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  stateOrRegion?: string | null;
  addressText?: string | null;
  confidence?: string | null;
  sourceType?: string | null;
  updatedAt?: string | Date | null;
  reviewCount?: number;
  latitude?: number | null;
  longitude?: number | null;
  features?: { type: string }[];
};

const FEATURE_FILTERS = [
  { id: "step_free_entry", label: "Step-free entry" },
  { id: "accessible_toilet", label: "Accessible toilet" },
  { id: "accessible_parking", label: "Accessible parking" },
  { id: "changing_places", label: "Changing Places" },
  { id: "lift_access", label: "Lift" },
  { id: "hearing_loop", label: "Hearing loop" },
  { id: "quiet_space", label: "Quiet space" },
] as const;

function toExplorationPlaces(
  inputs: AccessExplorationShellPlaceInput[],
): AccessExplorationPlace[] {
  return inputs.map((p) =>
    toAccessExplorationPlace({
      id: p.id,
      name: p.name,
      category: p.category,
      suburb: p.suburb,
      stateOrRegion: p.stateOrRegion,
      addressText: p.addressText,
      confidence: p.confidence,
      sourceType: p.sourceType,
      updatedAt: p.updatedAt,
      location:
        p.latitude != null && p.longitude != null
          ? { latitude: p.latitude, longitude: p.longitude }
          : null,
      features: p.features,
      _count: { reviews: p.reviewCount ?? 0 },
    }),
  );
}

/**
 * Flag-gated Access Experience V2 shell for `/access`.
 * Additive sibling to legacy MapAbleAccessShell body — keeps #516 mergeable.
 */
export function AccessExplorationShellV2({
  initialPlaces,
}: {
  initialPlaces: AccessExplorationShellPlaceInput[];
}) {
  const [exploration, setExploration] = useState<AccessExplorationState>(() =>
    loadExplorationSession(),
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [featureFilters, setFeatureFilters] = useState<string[]>([]);
  const [places, setPlaces] = useState(() => toExplorationPlaces(initialPlaces));
  const [listLimit, setListLimit] = useState(LIST_PAGE_PRESENTATION_SIZE);
  const [observationPlace, setObservationPlace] =
    useState<AccessExplorationPlace | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [gaisLayerOn, setGaisLayerOn] = useState(false);
  const [gaisSelectedId, setGaisSelectedId] = useState<string | undefined>();
  const [gaisFeatures, setGaisFeatures] = useState<GaisGeoJsonFeature[]>([]);
  const gaisClientEnabled = isClientGaisLayerEnabled();
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const activeRequirements = resolveActiveRequirements(exploration);
  const journeyMode = Boolean(exploration.journeyOverride);
  const view = exploration.presentationMode === "MAP" ? "map" : "list";

  useEffect(() => {
    saveExplorationSession(exploration);
  }, [exploration]);

  useEffect(() => {
    void fetch("/api/accessibility-profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.profile) return;
        const saved = accessibilityProfileToRequirements(data.profile);
        setExploration((current) => {
          if (current.savedRequirements) return current;
          return setSavedRequirements(current, saved);
        });
      })
      .catch(() => {
        // unauthenticated — local requirements only
      });
  }, []);

  const search = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (featureFilters.length) params.set("features", featureFilters.join(","));
    const res = await fetch(`/api/access/search?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setPlaces(
      toExplorationPlaces(
        data.results.map(
          (r: {
            place: {
              id: string;
              name: string;
              category: string;
              suburb?: string;
              confidence?: string;
              reviewCount: number;
              latitude?: number;
              longitude?: number;
              features?: { type: string }[] | string[];
            };
          }) => ({
            id: r.place.id,
            name: r.place.name,
            category: r.place.category,
            suburb: r.place.suburb,
            confidence: r.place.confidence,
            reviewCount: r.place.reviewCount,
            latitude: r.place.latitude,
            longitude: r.place.longitude,
            features: Array.isArray(r.place.features)
              ? r.place.features.map((f) =>
                  typeof f === "string" ? { type: f } : f,
                )
              : undefined,
          }),
        ),
      ),
    );
  }, [query, category, featureFilters]);

  const skipCategorySearchOnMount = useRef(true);
  useEffect(() => {
    if (skipCategorySearchOnMount.current) {
      skipCategorySearchOnMount.current = false;
      return;
    }
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- category/feature filter only
  }, [category, featureFilters]);

  const resultIds = useMemo(
    () =>
      buildExplorationResultIdsFromAccessPlaces(
        places,
        activeRequirements,
        exploration.unknownHandling,
      ),
    [places, activeRequirements, exploration.unknownHandling],
  );

  const orderedPlaces = useMemo(
    () => orderAccessExplorationPlacesByResultIds(places, resultIds),
    [places, resultIds],
  );

  const mapIds = useMemo(() => mapPresentationIds(resultIds), [resultIds]);
  const mapPlaces = useMemo(
    () =>
      orderAccessExplorationPlacesByResultIds(orderedPlaces, mapIds).filter(
        (p) => p.hasCoordinates,
      ),
    [orderedPlaces, mapIds],
  );

  const listIds = useMemo(
    () => listPresentationIds(resultIds, listLimit),
    [resultIds, listLimit],
  );
  const listPlaces = useMemo(
    () => orderAccessExplorationPlacesByResultIds(orderedPlaces, listIds),
    [orderedPlaces, listIds],
  );

  const hasMoreList = resultIds.length > listIds.length;
  const selectedPlace = orderedPlaces.find(
    (p) => p.placeId === exploration.selectedPlaceId,
  );

  useEffect(() => {
    setListLimit(LIST_PAGE_PRESENTATION_SIZE);
  }, [query, category, featureFilters, activeRequirements]);

  useEffect(() => {
    setStatusMessage(
      view === "map"
        ? `Map view: ${mapPlaces.length} of ${resultIds.length} places with coordinates (presentation limit ${MAP_MARKER_PRESENTATION_LIMIT}). List retains the full ordered set.`
        : `List view: showing ${listIds.length} of ${resultIds.length} places.`,
    );
  }, [view, mapPlaces.length, listIds.length, resultIds.length]);

  const handleViewChange = useCallback((next: "list" | "map") => {
    setExploration((current) => ({
      ...current,
      presentationMode: next === "map" ? "MAP" : "LIST",
    }));
  }, []);

  const handleSelectPlace = useCallback((id: string | undefined) => {
    setExploration((current) => ({ ...current, selectedPlaceId: id }));
  }, []);

  const handleUseSaved = useCallback(() => {
    setExploration((current) => applyJourneyOverride(current, null));
  }, []);

  const handleChangeJourney = useCallback(() => {
    setExploration((current) => {
      const base =
        current.savedRequirements ??
        current.requirements ??
        DEFAULT_ACCESS_REQUIREMENT_PROFILE;
      return applyJourneyOverride(current, { ...base });
    });
  }, []);

  const handleJourneyChange = useCallback((next: AccessRequirementProfile) => {
    setExploration((current) => applyJourneyOverride(current, next));
  }, []);

  function toggleFeature(id: string) {
    setFeatureFilters((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    );
  }

  const adsEnabled = isClientAdsAccessEnabled();
  const { markers: sponsoredMarkers } = useSponsoredMapMarkers({
    enabled: adsEnabled && view === "map",
    regionCode: "sydney",
  });

  const mapMarkerPlaces = mapPlaces.map((p) => ({
    id: p.placeId,
    name: p.name,
    latitude: p.latitude!,
    longitude: p.longitude!,
  }));

  return (
    <MobileAccessMapShell view={view} onViewChange={handleViewChange}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header>
          <h1 className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833]">
            MapAble Access
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Explore places against your access requirements. List view works without
            the map. Evidence may be incomplete — UNKNOWN is shown, never guessed.
          </p>
        </header>

        <AccessRequirementsPanel
          activeRequirements={activeRequirements}
          savedRequirements={exploration.savedRequirements}
          journeyMode={journeyMode}
          onUseSaved={handleUseSaved}
          onChangeJourney={handleChangeJourney}
          onJourneyChange={handleJourneyChange}
        />

        <AccessSearchBar value={query} onChange={setQuery} onSubmit={search} />

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="space-y-4">
            <AccessFilterPanel category={category} onCategoryChange={setCategory} />
            <fieldset className="rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-medium">Access features</legend>
              <ul className="mt-2 space-y-2">
                {FEATURE_FILTERS.map((f) => (
                  <li key={f.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={featureFilters.includes(f.id)}
                        onChange={() => toggleFeature(f.id)}
                      />
                      {f.label}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </div>

          <div className="space-y-4">
            <div
              className="inline-flex rounded-xl border border-slate-300 p-1"
              role="group"
              aria-label="Presentation mode"
            >
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-bold ${view === "list" ? "bg-[#005B7F] text-white" : ""} ${mapableInteractiveFocusRing}`}
                aria-pressed={view === "list"}
                onClick={() => handleViewChange("list")}
              >
                List
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-bold ${view === "map" ? "bg-[#005B7F] text-white" : ""} ${mapableInteractiveFocusRing}`}
                aria-pressed={view === "map"}
                onClick={() => handleViewChange("map")}
              >
                Map
              </button>
            </div>

            <LiveRegion message={statusMessage} id="access-exploration-live" />

            {gaisClientEnabled ? (
              <GaisLayerToggle enabled={gaisLayerOn} onChange={setGaisLayerOn} />
            ) : null}

            {selectedPlace ? (
              <section className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4">
                <h2 className="text-lg font-black">Selected place</h2>
                <p className="mt-1 font-semibold">{selectedPlace.name}</p>
                <div className="mt-3">
                  <AccessFitBreakdownV2
                    result={calculateAccessFitV2(
                      activeRequirements,
                      selectedPlace.accessProfile,
                    )}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/access/places/${selectedPlace.placeId}`}
                    className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
                  >
                    View details
                  </Link>
                  <Link
                    href={buildGoHandoffHref({
                      destinationPlaceId: selectedPlace.placeId,
                      requirements: activeRequirements,
                    })}
                    className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
                  >
                    Plan route
                  </Link>
                  <button
                    type="button"
                    className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
                    onClick={() => setObservationPlace(selectedPlace)}
                  >
                    Report a change
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-600">{GO_SANDBOX_DISCLAIMER}</p>
              </section>
            ) : null}

            {view === "map" ? (
              <MapErrorBoundary
                fallback={
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700" role="status">
                      Map could not load. List discovery remains available.
                    </p>
                    <button
                      type="button"
                      className={`min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
                      onClick={() => handleViewChange("list")}
                    >
                      Switch to list view
                    </button>
                    <ul className="space-y-4" aria-label="Accessible places list fallback">
                      {listPlaces.map((place) => (
                        <li key={place.placeId}>
                          <AccessExplorationPlaceCard
                            place={place}
                            requirements={activeRequirements}
                            isSelected={exploration.selectedPlaceId === place.placeId}
                            onSelect={() => handleSelectPlace(place.placeId)}
                            onReportChange={() => setObservationPlace(place)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                }
              >
                {mapPlaces.length < resultIds.length ? (
                  <p className="mb-3 text-sm text-slate-600" role="status">
                    Map shows {mapPlaces.length} of {resultIds.length} matching places
                    (same order as list; places without coordinates stay list-only).
                  </p>
                ) : null}
                <AccessMap
                  places={mapMarkerPlaces}
                  selectedId={exploration.selectedPlaceId}
                  onSelect={handleSelectPlace}
                  sponsoredMarkers={sponsoredMarkers}
                  gaisLayerEnabled={gaisLayerOn}
                  gaisSelectedId={gaisSelectedId}
                  onGaisSelect={setGaisSelectedId}
                  onGaisFeaturesChange={setGaisFeatures}
                />
              </MapErrorBoundary>
            ) : null}

            {gaisLayerOn ? (
              <GaisFeatureListPanel
                features={gaisFeatures}
                selectedId={gaisSelectedId}
                onSelect={setGaisSelectedId}
              />
            ) : null}

            {view === "list" ? (
              <div className="space-y-4">
                <ul className="space-y-4" aria-label="Accessible places">
                  {listPlaces.map((place) => (
                    <li key={place.placeId}>
                      <AccessExplorationPlaceCard
                        ref={(el) => {
                          cardRefs.current[place.placeId] = el;
                        }}
                        place={place}
                        requirements={activeRequirements}
                        isSelected={exploration.selectedPlaceId === place.placeId}
                        onSelect={() => handleSelectPlace(place.placeId)}
                        onReportChange={() => setObservationPlace(place)}
                      />
                    </li>
                  ))}
                </ul>
                {listPlaces.length === 0 ? (
                  <p className="text-muted-foreground" role="status">
                    No places match your search and requirements. Try adjusting filters.
                  </p>
                ) : null}
                {hasMoreList ? (
                  <button
                    type="button"
                    className={`min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold ${mapableInteractiveFocusRing}`}
                    onClick={() =>
                      setListLimit((n) => n + LIST_PAGE_PRESENTATION_SIZE)
                    }
                  >
                    Show more ({resultIds.length - listIds.length} remaining)
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{ACCESS_DISCLAIMER}</p>
        <noscript>
          <p className="text-sm text-slate-700">
            List view and place links work without interactive map scripts. Map view is an
            optional enhancement.
          </p>
        </noscript>
        <p className="text-sm">
          Prefer the competitor map landing?{" "}
          <Link href="/accessibility-map" className="font-semibold text-[#005B7F] underline">
            Open Accessibility Map
          </Link>
          .
        </p>
      </div>

      {observationPlace ? (
        <QuickObservationDialog
          place={{ id: observationPlace.placeId, name: observationPlace.name }}
          onClose={() => setObservationPlace(null)}
          onSubmitted={() => setObservationPlace(null)}
        />
      ) : null}
    </MobileAccessMapShell>
  );
}
