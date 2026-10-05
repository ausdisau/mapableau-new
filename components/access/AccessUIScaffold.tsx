"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AccessFitBreakdownV2 } from "@/components/access-fit/AccessFitBreakdownV2";
import { AccessRequirementsPanel } from "@/components/access-fit/AccessRequirementsPanel";
import { AccessEvidenceSummaryPanel } from "@/components/access/AccessEvidenceSummaryPanel";
import { AccessMap } from "@/components/access/AccessMap";
import { AccessMobilityPreferences } from "@/components/access/AccessMobilityPreferences";
import { AccessSourceLegend } from "@/components/access/AccessSourceLegend";
import {
  GccsaRegionSelector,
  type AccessRegionSelection,
} from "@/components/access/GccsaRegionSelector";
import { useGccsaBoundary } from "@/hooks/access/useGccsaBoundary";
import {
  buildExplorationResultIds,
  explorationDtoToFitSource,
  orderPlacesByResultIds,
} from "@/lib/access/experience/exploration-results";
import {
  applyJourneyOverride,
  createDefaultExplorationState,
  resolveActiveRequirements,
} from "@/lib/access/experience/exploration-state";
import {
  DEFAULT_ACCESS_REQUIREMENT_PROFILE,
  type AccessRequirementProfile,
} from "@/lib/access/experience/types";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { filterPlacesToGccsaRegion } from "@/lib/access/regions/filter-access-places";
import {
  ACCESS_NATIONAL_VIEW,
  getCapitalRegionBySlug,
} from "@/lib/access/regions/gccsa";
import { ACCESS_UI_SCAFFOLD_PLACES } from "@/lib/demo/access-ui-scaffold";
import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { Badge, Button, Input } from "@mapable/ui";

const SCAFFOLD_BASE_REQUIREMENTS: AccessRequirementProfile = {
  ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
  stepFreeRequired: true,
  accessibleToiletRequired: true,
};

export function AccessUIScaffold() {
  const [exploration, setExploration] = useState(() =>
    createDefaultExplorationState({
      requirements: { ...SCAFFOLD_BASE_REQUIREMENTS },
      savedRequirements: { ...SCAFFOLD_BASE_REQUIREMENTS },
      presentationMode: "LIST",
    }),
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [regionSelection, setRegionSelection] =
    useState<AccessRegionSelection>("all");
  const { boundary: gccsaBoundary, state: gccsaBoundaryState } =
    useGccsaBoundary();

  const activeRequirements = resolveActiveRequirements(exploration);
  const journeyMode = Boolean(exploration.journeyOverride);

  const regionFiltered = useMemo(
    () =>
      filterPlacesToGccsaRegion({
        places: ACCESS_UI_SCAFFOLD_PLACES,
        region: regionSelection,
        boundary: gccsaBoundary,
      }),
    [gccsaBoundary, regionSelection],
  );

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    const confidenceRank = { high: 0, medium: 1, low: 2, unknown: 3 } as const;

    const matches = regionFiltered.places.filter((place) => {
      if (category && place.category !== category) return false;
      if (
        exploration.evidencePreference === "VERIFIED_ONLY" &&
        place.evidence.dominantState !== "VERIFIED" &&
        place.evidence.dominantState !== "AUTHORITATIVE_SOURCE"
      ) {
        return false;
      }

      if (!q) return true;

      return (
        place.name.toLowerCase().includes(q) ||
        place.category.toLowerCase().includes(q) ||
        (place.suburb?.toLowerCase().includes(q) ?? false) ||
        (place.addressText?.toLowerCase().includes(q) ?? false)
      );
    });

    if (exploration.evidencePreference === "HIGH_CONFIDENCE") {
      return [...matches].sort(
        (a, b) =>
          confidenceRank[a.evidence.confidenceLabel] -
          confidenceRank[b.evidence.confidenceLabel],
      );
    }

    return matches;
  }, [
    category,
    exploration.evidencePreference,
    query,
    regionFiltered.places,
  ]);

  const resultIds = useMemo(
    () =>
      buildExplorationResultIds(
        filteredPlaces.map(explorationDtoToFitSource),
        activeRequirements,
        exploration.unknownHandling,
      ),
    [activeRequirements, exploration.unknownHandling, filteredPlaces],
  );

  const orderedPlaces = useMemo(() => {
    const withIds = filteredPlaces.map((place) => ({
      ...place,
      id: place.accessPlaceId,
    }));
    return orderPlacesByResultIds(withIds, resultIds);
  }, [filteredPlaces, resultIds]);

  const selectedPlace =
    orderedPlaces.find(
      (place) => place.accessPlaceId === exploration.selectedPlaceId,
    ) ??
    orderedPlaces[0] ??
    null;

  const selectedFit = useMemo(
    () =>
      selectedPlace
        ? calculateAccessFitV2(activeRequirements, selectedPlace.placeProfile)
        : null,
    [activeRequirements, selectedPlace],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(ACCESS_UI_SCAFFOLD_PLACES.map((place) => place.category)),
      ).sort(),
    [],
  );

  const mapPlaces = useMemo(
    () =>
      orderedPlaces
        .filter(
          (place) =>
            place.hasCoordinates &&
            typeof place.latitude === "number" &&
            typeof place.longitude === "number",
        )
        .map((place) => ({
          id: place.accessPlaceId,
          name: place.name,
          latitude: place.latitude as number,
          longitude: place.longitude as number,
        })),
    [orderedPlaces],
  );

  const regionView =
    regionSelection === "all"
      ? ACCESS_NATIONAL_VIEW
      : getCapitalRegionBySlug(regionSelection).view;

  const setSelectedPlace = (placeId: string) => {
    setExploration((current) => ({
      ...current,
      selectedPlaceId: placeId,
    }));
  };

  return (
    <main className="min-h-screen bg-[#F6FBFC] text-[#0C1833]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header className="rounded-3xl bg-[#0C1833] px-5 py-6 text-white sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white">
              UI scaffold
            </Badge>
            <Badge className="border-amber-300/40 bg-amber-300/10 text-amber-100">
              Synthetic fixture data
            </Badge>
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            MapAble Access national discovery scaffold
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            This route uses MapAble&apos;s production Access contracts, fit engine,
            evidence vocabulary, GCCSA controls and MapLibre map with synthetic
            places only. It is a UI integration surface, not live accessibility
            evidence.
          </p>
        </header>

        <GccsaRegionSelector
          value={regionSelection}
          boundaryState={gccsaBoundaryState}
          onChange={(next) => {
            setRegionSelection(next);
            setExploration((current) => ({
              ...current,
              selectedPlaceId: undefined,
            }));
          }}
        />

        {regionSelection !== "all" && !regionFiltered.boundaryApplied ? (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
            role="status"
          >
            The ABS GCCSA boundary is unavailable, so this scaffold is not
            pretending a fallback geography is the official boundary.
          </p>
        ) : null}

        {regionFiltered.unclassifiedCount > 0 ? (
          <p className="text-sm text-slate-600" role="status">
            {regionFiltered.unclassifiedCount} synthetic fixture
            {regionFiltered.unclassifiedCount === 1 ? "" : "s"} could not be
            assigned to the selected GCCSA.
          </p>
        ) : null}

        <section
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          aria-labelledby="scaffold-search-heading"
        >
          <h2 id="scaffold-search-heading" className="text-lg font-black">
            Search and evidence controls
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
            <label className="text-sm font-semibold">
              Search scaffold places
              <span className="relative mt-1 block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, suburb, address or category"
                  className="pl-10"
                />
              </span>
            </label>

            <label className="text-sm font-semibold">
              Place type
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={
                  "mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base " +
                  mapableInteractiveFocusRing
                }
              >
                <option value="">All types</option>
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Evidence preference
              <select
                value={exploration.evidencePreference}
                onChange={(event) =>
                  setExploration((current) => ({
                    ...current,
                    evidencePreference: event.target
                      .value as typeof current.evidencePreference,
                  }))
                }
                className={
                  "mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base " +
                  mapableInteractiveFocusRing
                }
              >
                <option value="ALL">All evidence</option>
                <option value="HIGH_CONFIDENCE">Higher confidence first</option>
                <option value="VERIFIED_ONLY">Verified-leaning only</option>
              </select>
            </label>

            <label className="text-sm font-semibold">
              Unknown evidence handling
              <select
                value={exploration.unknownHandling}
                onChange={(event) =>
                  setExploration((current) => ({
                    ...current,
                    unknownHandling: event.target
                      .value as typeof current.unknownHandling,
                  }))
                }
                className={
                  "mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base " +
                  mapableInteractiveFocusRing
                }
              >
                <option value="SHOW">Show places with unknowns</option>
                <option value="WARN">Show with unknown warnings</option>
                <option value="AVOID_WHEN_POSSIBLE">
                  Prefer fewer unknowns
                </option>
              </select>
            </label>
          </div>
        </section>

        <AccessRequirementsPanel
          activeRequirements={activeRequirements}
          savedRequirements={exploration.savedRequirements}
          journeyMode={journeyMode}
          onUseSaved={() =>
            setExploration((current) => applyJourneyOverride(current, null))
          }
          onChangeJourney={() =>
            setExploration((current) =>
              applyJourneyOverride(current, { ...activeRequirements }),
            )
          }
          onJourneyChange={(next: AccessRequirementProfile) =>
            setExploration((current) => applyJourneyOverride(current, next))
          }
        />

        <AccessMobilityPreferences
          value={activeRequirements}
          onChange={(next) =>
            setExploration((current) => applyJourneyOverride(current, next))
          }
        />

        <AccessSourceLegend />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex rounded-xl border border-slate-300 bg-white p-1"
            role="group"
            aria-label="Result presentation"
          >
            <Button
              type="button"
              variant={
                exploration.presentationMode === "LIST" ? "brand" : "ghost"
              }
              aria-pressed={exploration.presentationMode === "LIST"}
              onClick={() =>
                setExploration((current) => ({
                  ...current,
                  presentationMode: "LIST",
                }))
              }
            >
              List
            </Button>
            <Button
              type="button"
              variant={
                exploration.presentationMode === "MAP" ? "brand" : "ghost"
              }
              aria-pressed={exploration.presentationMode === "MAP"}
              onClick={() =>
                setExploration((current) => ({
                  ...current,
                  presentationMode: "MAP",
                }))
              }
            >
              Map
            </Button>
          </div>

          <p className="text-sm text-slate-600" role="status" aria-live="polite">
            {orderedPlaces.length} scaffold result
            {orderedPlaces.length === 1 ? "" : "s"} · list and map derive from
            the same result IDs
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          <section className="min-w-0 space-y-4" aria-labelledby="scaffold-results-heading">
            <h2 id="scaffold-results-heading" className="text-xl font-black">
              Scaffold places
            </h2>

            {exploration.presentationMode === "MAP" ? (
              <AccessMap
                places={mapPlaces}
                selectedId={selectedPlace?.accessPlaceId}
                onSelect={setSelectedPlace}
                gccsaBoundary={gccsaBoundary}
                selectedRegion={regionSelection}
                regionView={regionView}
              />
            ) : null}

            {orderedPlaces.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                No synthetic fixtures match the current region, search and
                AccessFit settings.
              </p>
            ) : (
              <ul className="space-y-3">
                {orderedPlaces.map((place) => {
                  const fit = calculateAccessFitV2(
                    activeRequirements,
                    place.placeProfile,
                  );
                  const selected =
                    selectedPlace?.accessPlaceId === place.accessPlaceId;

                  return (
                    <li key={place.accessPlaceId}>
                      <article
                        className={
                          "rounded-2xl border bg-white p-4 " +
                          (selected
                            ? "border-[#005B7F] shadow-sm"
                            : "border-slate-200")
                        }
                        aria-current={selected ? "true" : undefined}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              {place.category.replaceAll("_", " ")}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPlace(place.accessPlaceId)
                              }
                              className={
                                "min-h-11 text-left text-lg font-black text-[#0C1833] hover:text-[#005B7F] " +
                                mapableInteractiveFocusRing
                              }
                            >
                              {place.name}
                            </button>
                            <p className="text-sm text-slate-600">
                              {[place.suburb, place.stateOrRegion]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {
                              GAIS_EVIDENCE_STATE_LABELS[
                                place.evidence.dominantState
                              ]
                            }
                          </Badge>
                        </div>

                        <p className="mt-3 text-sm text-slate-700">
                          Access fit: {fit.metCount} meet · {fit.unmetCount} do
                          not match · {fit.unknownCount} unknown
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {place.evidence.freshnessLabel}
                        </p>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside
            className="space-y-4 self-start"
            aria-label="Selected scaffold place summary"
          >
            {selectedPlace && selectedFit ? (
              <>
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Synthetic fixture</Badge>
                    <Badge variant="outline">
                      {selectedPlace.evidence.confidenceLabel} confidence
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-black">
                    {selectedPlace.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {[selectedPlace.suburb, selectedPlace.stateOrRegion]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Production actions such as place details, route handoff and
                    change reporting are intentionally disabled on this fixture
                    route.
                  </p>
                </section>

                <AccessEvidenceSummaryPanel evidence={selectedPlace.evidence} />
                <AccessFitBreakdownV2 result={selectedFit} />
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Select a scaffold result to inspect canonical AccessFit and
                evidence components.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
