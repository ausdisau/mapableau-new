"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AccessFitBreakdownV2 } from "@/components/access-fit/AccessFitBreakdownV2";
import { AccessRequirementsPanel } from "@/components/access-fit/AccessRequirementsPanel";
import { QuickObservationDialog } from "@/components/accessibility-map/QuickObservationDialog";
import type { AccessExplorationDto } from "@/lib/access/experience/access-exploration-dto";
import {
  ACCESS_GO_HANDOFF_SANDBOX_NOTICE,
  accessToGoHref,
} from "@/lib/access/experience/access-route-handoff";
import {
  buildExplorationResultIds,
  explorationDtoToFitSource,
  listPresentationIds,
  mapCoordinateIds,
  orderPlacesByResultIds,
} from "@/lib/access/experience/exploration-results";
import {
  applyJourneyOverride,
  createDefaultExplorationState,
  resolveActiveRequirements,
} from "@/lib/access/experience/exploration-state";
import {
  loadExplorationSession,
  saveExplorationSession,
} from "@/lib/access/experience/session-storage";
import type {
  AccessExplorationState,
  AccessRequirementProfile,
} from "@/lib/access/experience/types";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";

const AccessMap = dynamic(
  () => import("@/components/access/AccessMap").then((m) => m.AccessMap),
  {
    ssr: false,
    loading: () => (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm" role="status">
        Loading map…
      </p>
    ),
  },
);

type PlaceRow = AccessExplorationDto & { id: string };

export function AccessExplorationShell({
  initialPlaces,
}: {
  initialPlaces: AccessExplorationDto[];
}) {
  const [exploration, setExploration] = useState<AccessExplorationState>(() =>
    createDefaultExplorationState({ presentationMode: "LIST" }),
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [listLimit, setListLimit] = useState(80);
  const [mapFailed, setMapFailed] = useState(false);
  const [reportPlace, setReportPlace] = useState<AccessExplorationDto | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    const saved = loadExplorationSession();
    setExploration((current) => ({
      ...current,
      ...saved,
      presentationMode:
        saved.presentationMode === "MAP" || saved.presentationMode === "LIST"
          ? saved.presentationMode
          : "LIST",
    }));
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveExplorationSession(exploration);
  }, [exploration]);

  const activeRequirements = resolveActiveRequirements(exploration);
  const journeyMode = Boolean(exploration.journeyOverride);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialPlaces.filter((place) => {
      if (category && place.category !== category) return false;
      if (!q) return true;
      return (
        place.name.toLowerCase().includes(q) ||
        (place.suburb?.toLowerCase().includes(q) ?? false) ||
        (place.addressText?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [initialPlaces, query, category]);

  const resultIds = useMemo(
    () =>
      buildExplorationResultIds(
        filteredPlaces.map(explorationDtoToFitSource),
        activeRequirements,
        exploration.unknownHandling,
      ),
    [filteredPlaces, activeRequirements, exploration.unknownHandling],
  );

  const orderedPlaces = useMemo(() => {
    const withIds: PlaceRow[] = filteredPlaces.map((p) => ({
      ...p,
      id: p.accessPlaceId,
    }));
    return orderPlacesByResultIds(withIds, resultIds);
  }, [filteredPlaces, resultIds]);

  const listIds = listPresentationIds(resultIds, listLimit);
  const listPlaces = useMemo(
    () => orderPlacesByResultIds(orderedPlaces, listIds),
    [orderedPlaces, listIds],
  );

  const mapIds = useMemo(
    () =>
      mapCoordinateIds(
        resultIds,
        orderedPlaces.map((p) => ({
          id: p.accessPlaceId,
          hasCoordinates: p.hasCoordinates,
        })),
      ),
    [resultIds, orderedPlaces],
  );

  const mapPlaces = useMemo(
    () =>
      orderedPlaces
        .filter((p) => mapIds.includes(p.accessPlaceId) && p.hasCoordinates)
        .map((p) => ({
          id: p.accessPlaceId,
          name: p.name,
          latitude: p.latitude as number,
          longitude: p.longitude as number,
        })),
    [orderedPlaces, mapIds],
  );

  const selectedPlace = orderedPlaces.find(
    (p) => p.accessPlaceId === exploration.selectedPlaceId,
  );

  const selectedFit = useMemo(() => {
    if (!selectedPlace) return null;
    return calculateAccessFitV2(activeRequirements, selectedPlace.placeProfile);
  }, [selectedPlace, activeRequirements]);

  const categories = useMemo(
    () => Array.from(new Set(initialPlaces.map((p) => p.category))).sort(),
    [initialPlaces],
  );

  const setPresentationMode = useCallback((mode: "LIST" | "MAP") => {
    setExploration((current) => ({ ...current, presentationMode: mode }));
    setStatusMessage(mode === "LIST" ? "Showing list view" : "Showing map view");
  }, []);

  const selectPlace = useCallback(
    (placeId: string) => {
      setExploration((current) => ({ ...current, selectedPlaceId: placeId }));
      const place = initialPlaces.find((p) => p.accessPlaceId === placeId);
      setStatusMessage(place ? `Selected ${place.name}` : "Place selected");
    },
    [initialPlaces],
  );

  const view = exploration.presentationMode === "MAP" ? "map" : "list";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-[#0C1833]">
          MapAble Access
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Discover places using your functional access requirements. List view works
          without the map. Unknown evidence is never treated as inaccessible.
        </p>
      </header>

      <div className="sr-only" aria-live="polite">
        {statusMessage}
        {` ${resultIds.length} places match your current filters and requirements.`}
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setStatusMessage(
            resultIds.length === 1
              ? "1 place matches"
              : `${resultIds.length} places match`,
          );
        }}
      >
        <label className="flex-1 text-sm font-medium text-slate-800">
          Search places
          <input
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, suburb, or address"
          />
        </label>
        <label className="text-sm font-medium text-slate-800 sm:w-56">
          Place type
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All types</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="min-h-11 self-end rounded-xl bg-[#005B7F] px-5 font-semibold text-white"
        >
          Search
        </button>
      </form>

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

      <fieldset className="space-y-2 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-[#0C1833]">
          Evidence and unknown data
        </legend>
        <label className="block text-sm">
          Evidence preference
          <select
            className="mt-1 min-h-11 w-full max-w-md rounded-xl border border-slate-300 px-3"
            value={exploration.evidencePreference}
            onChange={(e) =>
              setExploration((current) => ({
                ...current,
                evidencePreference: e.target
                  .value as AccessExplorationState["evidencePreference"],
              }))
            }
          >
            <option value="ALL">All evidence</option>
            <option value="HIGH_CONFIDENCE">Higher confidence first</option>
            <option value="VERIFIED_ONLY">Verified-leaning only</option>
          </select>
        </label>
        <label className="block text-sm">
          Unknown evidence handling
          <select
            className="mt-1 min-h-11 w-full max-w-md rounded-xl border border-slate-300 px-3"
            value={exploration.unknownHandling}
            onChange={(e) =>
              setExploration((current) => ({
                ...current,
                unknownHandling: e.target
                  .value as AccessExplorationState["unknownHandling"],
              }))
            }
          >
            <option value="SHOW">Show places with unknowns</option>
            <option value="WARN">Show with unknown warnings</option>
            <option value="AVOID_WHEN_POSSIBLE">Prefer fewer unknowns</option>
          </select>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Result presentation">
        <button
          type="button"
          className={`min-h-11 rounded-xl px-4 font-semibold ${view === "list" ? "bg-[#005B7F] text-white" : "border border-slate-300 bg-white"}`}
          aria-pressed={view === "list"}
          onClick={() => setPresentationMode("LIST")}
        >
          List
        </button>
        <button
          type="button"
          className={`min-h-11 rounded-xl px-4 font-semibold ${view === "map" ? "bg-[#005B7F] text-white" : "border border-slate-300 bg-white"}`}
          aria-pressed={view === "map"}
          onClick={() => setPresentationMode("MAP")}
        >
          Map
        </button>
        <p className="self-center text-sm text-slate-600" aria-live="polite">
          {resultIds.length} result{resultIds.length === 1 ? "" : "s"}
          {mapIds.length < resultIds.length
            ? ` · ${resultIds.length - mapIds.length} without map coordinates (list only)`
            : null}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="space-y-4">
          {view === "map" && !mapFailed ? (
            <div
              onErrorCapture={() => {
                setMapFailed(true);
                setPresentationMode("LIST");
                setStatusMessage("Map unavailable — continuing in list view");
              }}
            >
              <AccessMap
                places={mapPlaces}
                selectedId={exploration.selectedPlaceId}
                onSelect={selectPlace}
              />
            </div>
          ) : null}

          {mapFailed ? (
            <p
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
              role="status"
            >
              Map could not be loaded. Search, filters, list results, and place
              details still work.
            </p>
          ) : null}

          <section aria-labelledby="results-heading" className="space-y-3">
            <h2 id="results-heading" className="text-lg font-semibold text-[#0C1833]">
              Places
            </h2>
            {listPlaces.length === 0 ? (
              <p className="text-sm text-slate-600">
                No places match your current filters.
              </p>
            ) : (
              <ul className="divide-y rounded-xl border border-slate-200 bg-white">
                {listPlaces.map((place) => {
                  const fit = calculateAccessFitV2(
                    activeRequirements,
                    place.placeProfile,
                  );
                  const selected =
                    place.accessPlaceId === exploration.selectedPlaceId;
                  return (
                    <li key={place.accessPlaceId}>
                      <article
                        className={`space-y-2 p-4 ${selected ? "bg-[#F0F8FB]" : ""}`}
                        aria-current={selected ? "true" : undefined}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <button
                            type="button"
                            className="min-h-11 text-left font-semibold text-[#005B7F] underline-offset-2 hover:underline"
                            onClick={() => selectPlace(place.accessPlaceId)}
                          >
                            {place.name}
                          </button>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                            {place.hasCoordinates ? "On map" : "List only"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {[place.suburb, place.stateOrRegion]
                            .filter(Boolean)
                            .join(", ")}
                          {" · "}
                          {place.category.replaceAll("_", " ")}
                        </p>
                        <p className="text-sm text-slate-700">
                          Access fit: {fit.metCount} meet · {fit.unmetCount} do not
                          match · {fit.unknownCount} unknown
                        </p>
                        <p className="text-xs text-slate-500">
                          Evidence:{" "}
                          {GAIS_EVIDENCE_STATE_LABELS[place.evidence.dominantState]}
                          {" · "}
                          {place.evidence.freshnessLabel}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/access/places/${place.accessPlaceId}`}
                            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 text-sm font-medium"
                          >
                            View details
                          </Link>
                          <button
                            type="button"
                            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-medium"
                            onClick={() => setReportPlace(place)}
                          >
                            Report a change
                          </button>
                          <Link
                            href={accessToGoHref({
                              destinationPlaceId: place.accessPlaceId,
                              destinationName: place.name,
                              requirements: activeRequirements,
                              journeyOverrideActive: journeyMode,
                            })}
                            className="inline-flex min-h-11 items-center rounded-xl bg-[#0C1833] px-3 text-sm font-medium text-white"
                          >
                            Plan route
                          </Link>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
            {listIds.length < resultIds.length ? (
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-medium"
                onClick={() => setListLimit((n) => n + 80)}
              >
                Show more results
              </button>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4" aria-label="Selected place summary">
          {selectedPlace && selectedFit ? (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-[#0C1833]">
                  {selectedPlace.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPlace.addressText ??
                    [selectedPlace.suburb, selectedPlace.stateOrRegion]
                      .filter(Boolean)
                      .join(", ")}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Evidence:{" "}
                  {GAIS_EVIDENCE_STATE_LABELS[selectedPlace.evidence.dominantState]}
                  {" · "}
                  {selectedPlace.evidence.freshnessLabel}
                  {selectedPlace.evidence.disputed
                    ? " · Disputed reports present"
                    : ""}
                </p>
                {selectedPlace.accreditation ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Accreditation: {selectedPlace.accreditation.tier}.{" "}
                    {selectedPlace.accreditation.disclaimer}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/access/places/${selectedPlace.accessPlaceId}`}
                    className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 text-sm font-medium"
                  >
                    View details
                  </Link>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-medium"
                    onClick={() => setReportPlace(selectedPlace)}
                  >
                    Report a change
                  </button>
                  <Link
                    href={accessToGoHref({
                      destinationPlaceId: selectedPlace.accessPlaceId,
                      destinationName: selectedPlace.name,
                      requirements: activeRequirements,
                      journeyOverrideActive: journeyMode,
                    })}
                    className="inline-flex min-h-11 items-center rounded-xl bg-[#0C1833] px-3 text-sm font-medium text-white"
                  >
                    Plan route
                  </Link>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {ACCESS_GO_HANDOFF_SANDBOX_NOTICE}
                </p>
              </section>
              <AccessFitBreakdownV2 result={selectedFit} />
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              Select a place to inspect AccessFit, evidence, and actions. You can
              complete discovery entirely from the list.
            </p>
          )}
        </aside>
      </div>

      {reportPlace ? (
        <QuickObservationDialog
          place={{ id: reportPlace.accessPlaceId, name: reportPlace.name }}
          onClose={() => setReportPlace(null)}
          onSubmitted={() => {
            setReportPlace(null);
            setStatusMessage("Change report submitted as evidence");
          }}
        />
      ) : null}
    </div>
  );
}
