"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AccessFitBadge } from "@/components/access-fit/AccessFitBadge";
import { AccessNeedsTogglePanel } from "@/components/access-fit/AccessNeedsTogglePanel";
import { AccessPreflight } from "@/components/access-preflight/AccessPreflight";
import { AccessibleMapListToggle } from "@/components/accessibility-map/AccessibleMapListToggle";
import { ViewFloorPlanButton } from "@/components/accessibility-map/floor-plan/ViewFloorPlanButton";
import { OpenStreetMapView } from "@/components/accessibility-map/OpenStreetMapView";
import { ConsistentHelp } from "@/components/help/ConsistentHelp";
import { calculateAccessFit } from "@/lib/access-fit/calculate-access-fit";
import { hasActiveAccessNeeds } from "@/lib/access-fit/has-active-access-needs";
import { DEMO_ACCESS_NEEDS, EMPTY_ACCESS_NEEDS } from "@/lib/access-fit/types";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import {
  ACCESS_MAP_FILTERS,
  DEMO_ACCESS_PLACES,
  filterDemoPlaces,
  type DemoAccessPlace,
} from "@/lib/demo/accessibility-places";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const VIEW_STORAGE_KEY = "mapable-accessibility-map-view";

const PRIMARY_FILTER_IDS = [
  "step-free",
  "toilet",
  "parking",
  "drop-off",
  "quiet",
  "assistance-animal",
] as const;

type AccessMapFilter = (typeof ACCESS_MAP_FILTERS)[number];

function isPrimaryFilter(filter: AccessMapFilter): boolean {
  return (PRIMARY_FILTER_IDS as readonly string[]).includes(filter.id);
}

export function AccessibilityMapLanding({
  initialPlaces = DEMO_ACCESS_PLACES,
}: {
  initialPlaces?: DemoAccessPlace[];
}) {
  const [location, setLocation] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [verification, setVerification] = useState("");
  const [transportOption, setTransportOption] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [needs, setNeeds] = useState(EMPTY_ACCESS_NEEDS);
  const [useDemoNeeds, setUseDemoNeeds] = useState(false);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    try {
      const preferred =
        typeof document !== "undefined"
          ? document.documentElement.dataset.a11yMapList
          : undefined;
      if (preferred === "list" || preferred === "map") {
        setView(preferred);
        return;
      }
      const stored = sessionStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "list" || stored === "map") {
        setView(stored);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const handleViewChange = useCallback((next: "list" | "map") => {
    setView(next);
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const places = useMemo(() => {
    const filters = [...selectedFilters];
    if (transportOption === "bookable") filters.push("transport-bookable");
    if (transportOption === "nearby") filters.push("pt-nearby");
    if (verification === "verified") filters.push("verified");

    return filterDemoPlaces(initialPlaces, {
      query: [query, placeType].filter(Boolean).join(" "),
      suburb: location,
      filters,
    });
  }, [
    initialPlaces,
    location,
    placeType,
    query,
    selectedFilters,
    transportOption,
    verification,
  ]);

  const activeNeeds = useDemoNeeds ? DEMO_ACCESS_NEEDS : needs;
  const preferencesActive = useDemoNeeds || hasActiveAccessNeeds(needs);

  const primaryFilters = ACCESS_MAP_FILTERS.filter(isPrimaryFilter);
  const moreFilters = ACCESS_MAP_FILTERS.filter((filter) => !isPrimaryFilter(filter));

  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    for (const filter of ACCESS_MAP_FILTERS) {
      if (!selectedFilters.includes(filter.id)) continue;
      chips.push({
        id: filter.id,
        label: filter.label,
        onRemove: () =>
          setSelectedFilters((current) => current.filter((item) => item !== filter.id)),
      });
    }
    if (verification === "verified") {
      chips.push({
        id: "verification-verified",
        label: "MapAble verified",
        onRemove: () => setVerification(""),
      });
    }
    if (transportOption === "nearby") {
      chips.push({
        id: "transport-nearby",
        label: "Public transport nearby",
        onRemove: () => setTransportOption(""),
      });
    }
    if (transportOption === "bookable") {
      chips.push({
        id: "transport-bookable",
        label: "Transport bookable",
        onRemove: () => setTransportOption(""),
      });
    }
    return chips;
  }, [selectedFilters, transportOption, verification]);

  const handleSelectPlace = useCallback((id: string | undefined) => {
    setSelectedId(id);
  }, []);

  const handleCardSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (view === "map") return;
      const el = cardRefs.current[id];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    },
    [view],
  );

  function toggleFilter(id: string) {
    setSelectedFilters((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function clearAllFilters() {
    setSelectedFilters([]);
    setVerification("");
    setTransportOption("");
    setLocation("");
    setPlaceType("");
    setQuery("");
  }

  const hasActiveFilters =
    activeFilterChips.length > 0 ||
    Boolean(location.trim()) ||
    Boolean(placeType) ||
    Boolean(query.trim());

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Accessibility Map
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.045em] md:text-6xl">
            Know before you go.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Search accessible places with practical details, confidence levels, photos,
            measurements, and transport/support options.
          </p>
          <p className="mt-3 text-sm font-semibold text-amber-900">
            Places below include clearly labelled demo data while live coverage grows.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[20rem_1fr] lg:px-8">
        <aside className="space-y-4" aria-label="Search and filters">
          <form
            className="space-y-4 rounded-2xl border border-slate-200 p-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div>
              <label htmlFor="access-location" className="text-sm font-semibold">
                Location
              </label>
              <input
                id="access-location"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Suburb or city"
              />
            </div>
            <div>
              <label htmlFor="access-query" className="text-sm font-semibold">
                Place search
              </label>
              <input
                id="access-query"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cafe, library, toilet…"
              />
            </div>
            <div>
              <label htmlFor="access-place-type" className="text-sm font-semibold">
                Place type
              </label>
              <select
                id="access-place-type"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
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
            <div>
              <label htmlFor="access-verification" className="text-sm font-semibold">
                Verification status
              </label>
              <select
                id="access-verification"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
                value={verification}
                onChange={(event) => setVerification(event.target.value)}
              >
                <option value="">Any status</option>
                <option value="verified">MapAble verified / accredited</option>
              </select>
            </div>
            <div>
              <label htmlFor="access-transport" className="text-sm font-semibold">
                Transport options
              </label>
              <select
                id="access-transport"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
                value={transportOption}
                onChange={(event) => setTransportOption(event.target.value)}
              >
                <option value="">Any</option>
                <option value="nearby">Public transport nearby</option>
                <option value="bookable">Transport bookable</option>
              </select>
            </div>
          </form>

          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold">Place access features</legend>
            <p className="mt-1 text-xs text-slate-600">
              Filters for what the venue reports — separate from your personal access needs.
            </p>
            <ul className="mt-2 space-y-2">
              {primaryFilters.map((filter) => (
                <li key={filter.id}>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => toggleFilter(filter.id)}
                      className={mapableCareFocusRing}
                    />
                    <span>{filter.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <details className="mt-3 rounded-xl border border-slate-200 bg-[#F6FBFC] p-3">
              <summary
                className={`min-h-11 cursor-pointer list-inside text-sm font-semibold ${mapableCareFocusRing}`}
              >
                More access filters
              </summary>
              <ul className="mt-2 space-y-2">
                {moreFilters.map((filter) => (
                  <li key={filter.id}>
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(filter.id)}
                        onChange={() => toggleFilter(filter.id)}
                        className={mapableCareFocusRing}
                      />
                      <span>{filter.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          </fieldset>

          {activeFilterChips.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Selected filters</p>
              <ul className="flex flex-wrap gap-2" aria-label="Active filters">
                {activeFilterChips.map((chip) => (
                  <li key={chip.id}>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-sm font-semibold ${mapableCareFocusRing}`}
                      aria-label={`Remove ${chip.label} filter`}
                    >
                      <span aria-hidden="true">{chip.label} ×</span>
                      <span className="sr-only">{chip.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className={`min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Clear all filters
            </button>
          ) : null}

          <details
            id="my-access-needs"
            className="rounded-2xl border border-slate-200 bg-white p-4"
            open={preferencesActive}
          >
            <summary
              className={`min-h-11 cursor-pointer text-sm font-semibold ${mapableCareFocusRing}`}
            >
              My access needs
            </summary>
            <p className="mt-2 text-xs text-slate-600">
              Personal requirements used for Access-Fit. These are not venue filters.
            </p>
            <div className="mt-3 space-y-3">
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={useDemoNeeds}
                  onChange={(event) => setUseDemoNeeds(event.target.checked)}
                  className={mapableCareFocusRing}
                />
                Use demo wheelchair Access-Fit profile
              </label>
              {!useDemoNeeds ? (
                <AccessNeedsTogglePanel needs={needs} onChange={setNeeds} />
              ) : null}
            </div>
          </details>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <AccessibleMapListToggle
              view={view}
              onChange={handleViewChange}
              resultCount={places.length}
              selectedLabel={places.find((place) => place.id === selectedId)?.name}
            />
            <ConsistentHelp
              contextTitle="Accessibility map"
              plainLanguage="Use List view for the same places and access facts as the map. Unknown access details mean we do not have confirmation yet — not that the place is accessible."
              safetyNote="If you are in immediate danger, call 000. MapAble is not an emergency service."
            />
          </div>

          {view === "map" ? (
            <OpenStreetMapView
              places={places}
              selectedId={selectedId}
              onSelect={handleSelectPlace}
              activeNeeds={activeNeeds}
              onSwitchToList={() => handleViewChange("list")}
            />
          ) : null}

          {view === "list" ? (
            <ul className="space-y-4" aria-label="Accessible places">
              {places.map((place) => {
                const fit = calculateAccessFit(activeNeeds, place.profile);
                const isSelected = selectedId === place.id;
                return (
                  <li key={place.id}>
                    <article
                      ref={(el) => {
                        cardRefs.current[place.id] = el;
                      }}
                      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                        isSelected
                          ? "border-[#005B7F] ring-2 ring-[#005B7F]/30"
                          : "border-slate-200"
                      }`}
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-black">{place.name}</h2>
                          <p className="text-sm text-slate-600 capitalize">
                            {place.category.replace(/_/g, " ")} · {place.suburb}, {place.state}
                          </p>
                        </div>
                        <div className="space-y-1 text-left sm:max-w-xs sm:text-left">
                          <p className="text-sm font-bold">
                            Access evidence score {place.accessScore} · {place.tier}
                          </p>
                          <p className="text-sm text-slate-600">
                            Confidence: {place.confidence} · Last checked {place.lastChecked}
                          </p>
                          <p className="text-sm text-slate-600">
                            Source: {place.source} · Demo data
                          </p>
                        </div>
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {place.topAccessFacts.map((fact) => (
                          <li
                            key={fact}
                            className="rounded-full bg-[#F6FBFC] px-3 py-1 text-xs font-semibold text-[#005B7F]"
                          >
                            {fact}
                          </li>
                        ))}
                      </ul>
                      {place.keyBarrier ? (
                        <p className="mt-3 text-sm text-amber-900">
                          Key barrier: {place.keyBarrier}
                        </p>
                      ) : null}
                      <div className="mt-3">
                        <AccessFitBadge
                          score={fit.score}
                          label={fit.label}
                          preferencesActive={preferencesActive}
                        />
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Link
                          href={`/accessibility-map/${place.slug}`}
                          className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
                        >
                          View access details
                          <span className="sr-only"> for {place.name}</span>
                        </Link>
                        <Link
                          href={`/journey-planner?destination=${encodeURIComponent(place.name)}`}
                          className={`inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black ${mapableCareFocusRing}`}
                        >
                          Plan trip
                          <span className="sr-only"> to {place.name}</span>
                        </Link>
                        <details className="w-full min-w-0 sm:w-auto">
                          <summary
                            className={`inline-flex min-h-11 w-full cursor-pointer list-inside items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-black sm:w-auto ${mapableCareFocusRing}`}
                          >
                            More actions
                            <span className="sr-only"> for {place.name}</span>
                          </summary>
                          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-slate-200 bg-[#F6FBFC] p-3">
                            {place.hasFloorPlan ? (
                              <ViewFloorPlanButton
                                venueId={place.id}
                                venueName={place.name}
                                venueSlug={place.slug}
                              />
                            ) : null}
                            <button
                              type="button"
                              className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
                              onClick={() => {
                                handleCardSelect(place.id);
                                handleViewChange("map");
                              }}
                            >
                              Show on map
                              <span className="sr-only">: {place.name}</span>
                            </button>
                            <Link
                              href={`/add-access-info?place=${encodeURIComponent(place.name)}`}
                              className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
                            >
                              Report update
                              <span className="sr-only"> for {place.name}</span>
                            </Link>
                            <Link
                              href={`/report-barrier?placeSlug=${encodeURIComponent(place.slug)}&placeName=${encodeURIComponent(place.name)}`}
                              className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
                            >
                              Report an access barrier
                              <span className="sr-only"> for {place.name}</span>
                            </Link>
                          </div>
                        </details>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {selectedId
            ? (() => {
                const selected = places.find((place) => place.id === selectedId);
                return selected ? (
                  <AccessPreflight key={selected.id} place={selected} />
                ) : null;
              })()
            : null}

          <section
            aria-labelledby="help-map-heading"
            className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-6"
          >
            <h2 id="help-map-heading" className="text-2xl font-black">
              Help map this area.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Missing access details? Add what you know, or join a community mapping day.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/add-access-info"
                className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
              >
                Add place
              </Link>
              <Link
                href="/add-access-info"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
              >
                Update access info
              </Link>
              <Link
                href="/mapping-days"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
              >
                Join mapping day
              </Link>
            </div>
          </section>

          <p className="text-sm text-slate-600" role="note">
            Access information can change. Confirm critical access needs before travelling.
            {` ${ACCESS_DISCLAIMER}`}
          </p>

          <p className="text-sm">
            Looking for the operational map shell?{" "}
            <Link href="/access" className={`font-semibold text-[#005B7F] underline ${mapableCareFocusRing}`}>
              Open /access
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
