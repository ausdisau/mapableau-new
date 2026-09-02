"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LiveRegion } from "@/components/a11y/LiveRegion";
import { AccessFitBreakdownV2 } from "@/components/access-fit/AccessFitBreakdownV2";
import { AccessRequirementsPanel } from "@/components/access-fit/AccessRequirementsPanel";
import { QuickObservationDialog } from "@/components/accessibility-map/QuickObservationDialog";
import { VenueListCardV2 } from "@/components/accessibility-map/VenueListCardV2";
import { MapErrorBoundary } from "@/components/error/MapErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  LIST_PAGE_PRESENTATION_SIZE,
  MAP_MARKER_PRESENTATION_LIMIT,
  buildExplorationResultIds,
  listPresentationIds,
  mapPresentationIds,
  orderPlacesByResultIds,
} from "@/lib/access/experience/exploration-results";
import {
  applyJourneyOverride,
  resolveActiveRequirements,
  setSavedRequirements,
} from "@/lib/access/experience/exploration-state";
import {
  accessibilityProfileToRequirements,
  accessNeedToRequirementProfile,
} from "@/lib/access/experience/requirement-profile";
import {
  loadExplorationSession,
  saveExplorationSession,
} from "@/lib/access/experience/session-storage";
import type { AccessExplorationState, AccessRequirementProfile } from "@/lib/access/experience/types";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "@/lib/access/experience/types";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { ACCESS_DISCLAIMER } from "@/lib/access/map/copy";
import {
  ACCESS_MAP_FILTERS,
  filterDemoPlaces,
  type DemoAccessPlace,
} from "@/lib/demo/accessibility-places";
import {
  mapableCareFocusRing,
  mapableInteractiveFocusRing,
} from "@/lib/marketing/mapable-care-tokens";
import { toPublicVenueSpec } from "@/lib/offline/public-venue-dto";
import { saveVenueSearchCache } from "@/lib/offline/venue-search-cache";


const OpenStreetMapView = dynamic(
  () =>
    import("@/components/accessibility-map/OpenStreetMapView").then((m) => ({
      default: m.OpenStreetMapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[420px] rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4 md:min-h-[60vh]"
        role="status"
        aria-label="Loading map"
      >
        <Skeleton className="h-full min-h-[388px] w-full" />
      </div>
    ),
  },
);

const RESULTS_PANEL_ID = "access-map-results-panel";

export function AccessExplorationLandingV2({
  initialPlaces,
  dataSourceNote,
}: {
  initialPlaces: DemoAccessPlace[];
  dataSourceNote?: string;
}) {
  const [exploration, setExploration] = useState<AccessExplorationState>(() =>
    loadExplorationSession(),
  );
  const [location, setLocation] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [listLimit, setListLimit] = useState(LIST_PAGE_PRESENTATION_SIZE);
  const [observationPlace, setObservationPlace] = useState<DemoAccessPlace | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const online = useOnlineStatus();

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
        // unauthenticated or unavailable — local requirements only
      });
  }, []);

  const filteredPlaces = useMemo(() => {
    const filters = [...selectedFilters];

    return filterDemoPlaces(initialPlaces, {
      query: [query, placeType].filter(Boolean).join(" "),
      suburb: location,
      filters,
    });
  }, [initialPlaces, location, placeType, query, selectedFilters]);

  const resultIds = useMemo(
    () =>
      buildExplorationResultIds(
        filteredPlaces,
        activeRequirements,
        exploration.unknownHandling,
      ),
    [filteredPlaces, activeRequirements, exploration.unknownHandling],
  );

  const orderedPlaces = useMemo(
    () => orderPlacesByResultIds(filteredPlaces, resultIds),
    [filteredPlaces, resultIds],
  );

  const mapIds = useMemo(() => mapPresentationIds(resultIds), [resultIds]);
  const mapPlaces = useMemo(
    () => orderPlacesByResultIds(orderedPlaces, mapIds),
    [orderedPlaces, mapIds],
  );

  const listIds = useMemo(
    () => listPresentationIds(resultIds, listLimit),
    [resultIds, listLimit],
  );
  const listPlaces = useMemo(
    () => orderPlacesByResultIds(orderedPlaces, listIds),
    [orderedPlaces, listIds],
  );

  const hasMoreList = resultIds.length > listIds.length;
  const selectedPlace = orderedPlaces.find(
    (p) => p.id === exploration.selectedPlaceId,
  );

  useEffect(() => {
    setListLimit(LIST_PAGE_PRESENTATION_SIZE);
  }, [query, location, placeType, selectedFilters, activeRequirements]);

  useEffect(() => {
    if (!online || orderedPlaces.length === 0) return;
    const searchQuery = [query, placeType, location, ...selectedFilters]
      .filter(Boolean)
      .join(" ");
    void saveVenueSearchCache({
      query: searchQuery || "all",
      cachedAt: new Date().toISOString(),
      venues: orderedPlaces.map(toPublicVenueSpec),
    }).catch(() => {});
  }, [online, orderedPlaces, query, placeType, location, selectedFilters]);

  useEffect(() => {
    setStatusMessage(
      view === "map"
        ? `Map view: ${mapIds.length} of ${resultIds.length} places shown (presentation limit ${MAP_MARKER_PRESENTATION_LIMIT}).`
        : `List view: showing ${listIds.length} of ${resultIds.length} places.`,
    );
  }, [view, mapIds.length, listIds.length, resultIds.length]);

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
    setExploration((current) =>
      applyJourneyOverride(current, null),
    );
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

  function toggleFilter(id: string) {
    setSelectedFilters((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const activeNeeds = accessNeedToRequirementProfile(activeRequirements);

  const listFallback = (
    <ul className="mt-4 space-y-4" aria-label="Accessible places list fallback">
      {listPlaces.map((place) => (
        <li key={place.id}>
          <VenueListCardV2
            place={place}
            requirements={activeRequirements}
            isSelected={exploration.selectedPlaceId === place.id}
            onReportChange={() => setObservationPlace(place)}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Accessibility Map
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.045em] md:text-6xl">
            Where do you want to go?
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Search places, apply your access requirements, and compare supporting evidence —
            with or without the map.
          </p>
          {dataSourceNote ? (
            <p className="mt-2 text-sm text-slate-600" role="note">
              {dataSourceNote}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[20rem_1fr] lg:px-8">
        <aside className="space-y-4" aria-label="Search and filters">
          <form
            className="space-y-4 rounded-2xl border border-slate-200 p-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div>
              <label htmlFor="access-v2-query" className="text-sm font-semibold">
                Search
              </label>
              <input
                id="access-v2-query"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Place name, suburb, category…"
              />
            </div>
            <div>
              <label htmlFor="access-v2-location" className="text-sm font-semibold">
                Location
              </label>
              <input
                id="access-v2-location"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Suburb or city"
              />
            </div>
            <div>
              <label htmlFor="access-v2-place-type" className="text-sm font-semibold">
                Place type
              </label>
              <select
                id="access-v2-place-type"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={placeType}
                onChange={(event) => setPlaceType(event.target.value)}
              >
                <option value="">Any type</option>
                <option value="library">Library</option>
                <option value="cafe">Cafe / restaurant</option>
                <option value="toilet">Public toilet</option>
                <option value="gallery">Gallery / venue</option>
              </select>
            </div>
          </form>

          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold">Access filters</legend>
            <ul className="mt-2 space-y-2">
              {ACCESS_MAP_FILTERS.map((filter) => (
                <li key={filter.id}>
                  <label
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm ${mapableInteractiveFocusRing}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => toggleFilter(filter.id)}
                      aria-controls={RESULTS_PANEL_ID}
                    />
                    <span>{filter.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <AccessRequirementsPanel
            activeRequirements={activeRequirements}
            savedRequirements={exploration.savedRequirements}
            journeyMode={journeyMode}
            onUseSaved={handleUseSaved}
            onChangeJourney={handleChangeJourney}
            onJourneyChange={handleJourneyChange}
          />
        </aside>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" role="status" aria-live="polite">
              {resultIds.length} place{resultIds.length === 1 ? "" : "s"} match your search
            </p>
            <div
              role="group"
              aria-label="Map or list view"
              className="inline-flex rounded-xl border border-slate-300 p-1"
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
          </div>

          <LiveRegion message={statusMessage} id="access-exploration-live" />

          {selectedPlace ? (
            <section className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4">
              <h2 className="text-lg font-black">Selected place</h2>
              <p className="mt-1 font-semibold">{selectedPlace.name}</p>
              <div className="mt-3">
                <AccessFitBreakdownV2
                  result={calculateAccessFitV2(activeRequirements, selectedPlace.profile)}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/accessibility-map/${selectedPlace.slug}`}
                  className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
                >
                  View details
                </Link>
                <button
                  type="button"
                  className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
                  onClick={() => setObservationPlace(selectedPlace)}
                >
                  Report a change
                </button>
              </div>
            </section>
          ) : null}

          <div id={RESULTS_PANEL_ID} className="min-h-[420px] md:min-h-[60vh]">
            {view === "map" ? (
              <MapErrorBoundary
                fallback={
                  <div>
                    <button
                      type="button"
                      className={`min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
                      onClick={() => handleViewChange("list")}
                    >
                      Switch to list view
                    </button>
                    {listFallback}
                  </div>
                }
              >
                {mapIds.length < resultIds.length ? (
                  <p className="mb-3 text-sm text-slate-600" role="status">
                    Map shows {mapIds.length} of {resultIds.length} matching places (same order as
                    list; refine search to focus pins).
                  </p>
                ) : null}
                <OpenStreetMapView
                  places={mapPlaces}
                  selectedId={exploration.selectedPlaceId}
                  onSelect={handleSelectPlace}
                  activeNeeds={activeNeeds}
                  onSwitchToList={() => handleViewChange("list")}
                  gaisLayerEnabled={false}
                />
              </MapErrorBoundary>
            ) : (
              <div className="space-y-4">
                <ul className="space-y-4" aria-label="Accessible places">
                  {listPlaces.map((place) => (
                    <li key={place.id}>
                      <VenueListCardV2
                        ref={(el) => {
                          cardRefs.current[place.id] = el;
                        }}
                        place={place}
                        requirements={activeRequirements}
                        isSelected={exploration.selectedPlaceId === place.id}
                        onSelect={() => handleSelectPlace(place.id)}
                        onReportChange={() => setObservationPlace(place)}
                      />
                    </li>
                  ))}
                </ul>
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
            )}
          </div>

          <p className="text-sm text-slate-600" role="note">
            Access information can change. Confirm critical access needs before travelling.{" "}
            {ACCESS_DISCLAIMER}
          </p>
        </div>
      </div>

      {observationPlace ? (
        <QuickObservationDialog
          place={observationPlace}
          onClose={() => setObservationPlace(null)}
          onSubmitted={() => {
            setObservationPlace(null);
            setStatusMessage(
              `Thank you — your observation for ${observationPlace.name} was submitted for review.`,
            );
          }}
        />
      ) : null}
    </div>
  );
}
