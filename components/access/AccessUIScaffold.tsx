"use client";

import {
  Check,
  CircleHelp,
  List,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  SCAFFOLD_CITIES,
  SCAFFOLD_PLACES,
  SCAFFOLD_REQUIREMENTS,
  type ScaffoldAccessState,
  type ScaffoldPlace,
  type ScaffoldRequirementKey,
} from "@/lib/access/scaffold-data";

type Presentation = "list" | "map";

const accessStateCopy: Record<
  ScaffoldAccessState,
  { label: string; className: string }
> = {
  MEETS: {
    label: "Meets",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  DOES_NOT_MATCH: {
    label: "Does not match",
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  UNKNOWN: {
    label: "Unknown",
    className: "border-slate-300 bg-slate-50 text-slate-700",
  },
};

function scorePlace(place: ScaffoldPlace, requirements: ScaffoldRequirementKey[]) {
  return requirements.reduce(
    (score, key) => {
      const state = place.requirements[key];
      if (state === "MEETS") score.meets += 1;
      if (state === "DOES_NOT_MATCH") score.doesNotMatch += 1;
      if (state === "UNKNOWN") score.unknown += 1;
      return score;
    },
    { meets: 0, doesNotMatch: 0, unknown: 0 },
  );
}

function AccessStateBadge({ state }: { state: ScaffoldAccessState }) {
  const copy = accessStateCopy[state];
  return (
    <span
      className={
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold " +
        copy.className
      }
    >
      {state === "MEETS" ? (
        <Check aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
      ) : state === "DOES_NOT_MATCH" ? (
        <X aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
      ) : (
        <CircleHelp aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
      )}
      {copy.label}
    </span>
  );
}

function EvidenceBadge({ place }: { place: ScaffoldPlace }) {
  const styles =
    place.evidenceState === "VERIFIED"
      ? "border-[#005B7F]/25 bg-[#EAF6FA] text-[#004766]"
      : place.evidenceState === "AUTHORITATIVE_SOURCE"
        ? "border-indigo-200 bg-indigo-50 text-indigo-950"
        : place.evidenceState === "COMMUNITY_REPORTED"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <span
      className={
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold " +
        styles
      }
    >
      {place.evidenceLabel}
    </span>
  );
}

function PlaceCard({
  place,
  selected,
  activeRequirements,
  onSelect,
}: {
  place: ScaffoldPlace;
  selected: boolean;
  activeRequirements: ScaffoldRequirementKey[];
  onSelect: () => void;
}) {
  const score = scorePlace(place, activeRequirements);

  return (
    <article
      className={
        "rounded-2xl border bg-white p-4 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[#005B7F] focus-within:ring-offset-2 " +
        (selected ? "border-[#005B7F] shadow-md" : "border-slate-200")
      }
      aria-current={selected ? "true" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {place.category} · {place.city}
          </p>
          <button
            type="button"
            className="mt-1 min-h-11 text-left text-lg font-bold text-[#0C1833] underline-offset-4 hover:text-[#005B7F] hover:underline"
            onClick={onSelect}
          >
            {place.name}
          </button>
          <p className="text-sm text-slate-600">
            {place.suburb}, {place.state}
          </p>
        </div>
        <EvidenceBadge place={place} />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700">{place.summary}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-emerald-50 px-2 py-2">
          <strong className="block text-lg text-emerald-950">{score.meets}</strong>
          <span className="text-xs text-emerald-900">meet</span>
        </div>
        <div className="rounded-xl bg-rose-50 px-2 py-2">
          <strong className="block text-lg text-rose-950">
            {score.doesNotMatch}
          </strong>
          <span className="text-xs text-rose-900">do not match</span>
        </div>
        <div className="rounded-xl bg-slate-100 px-2 py-2">
          <strong className="block text-lg text-slate-900">{score.unknown}</strong>
          <span className="text-xs text-slate-700">unknown</span>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#0C1833] hover:bg-slate-50"
        onClick={onSelect}
      >
        Inspect access evidence
      </button>
    </article>
  );
}

export function AccessUIScaffold() {
  const [presentation, setPresentation] = useState<Presentation>("list");
  const [query, setQuery] = useState("");
  const [city, setCity] =
    useState<(typeof SCAFFOLD_CITIES)[number]>("All cities");
  const [activeRequirements, setActiveRequirements] = useState<
    ScaffoldRequirementKey[]
  >(["stepFree", "accessibleToilet"]);
  const [selectedId, setSelectedId] = useState(SCAFFOLD_PLACES[0]!.id);
  const [unknownPolicy, setUnknownPolicy] =
    useState<"show" | "prefer-known">("show");

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();

    const places = SCAFFOLD_PLACES.filter((place) => {
      if (city !== "All cities" && place.city !== city) return false;

      if (
        q &&
        ![place.name, place.suburb, place.city, place.category]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }

      return true;
    });

    if (unknownPolicy === "prefer-known" && activeRequirements.length > 0) {
      return [...places].sort((a, b) => {
        const aScore = scorePlace(a, activeRequirements);
        const bScore = scorePlace(b, activeRequirements);
        return aScore.unknown - bScore.unknown;
      });
    }

    return places;
  }, [activeRequirements, city, query, unknownPolicy]);

  const selectedPlace =
    filteredPlaces.find((place) => place.id === selectedId) ??
    SCAFFOLD_PLACES.find((place) => place.id === selectedId) ??
    filteredPlaces[0] ??
    null;

  const toggleRequirement = (key: ScaffoldRequirementKey) => {
    setActiveRequirements((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  return (
    <main className="min-h-screen bg-[#F6FBFC] text-[#0C1833]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl bg-[#0C1833] px-5 py-6 text-white shadow-sm sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8ED6E8]">
            MapAble Access · UI scaffold
          </p>
          <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Find places that fit your access requirements
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                This coded scaffold demonstrates the national discovery flow with
                fixture data only. Unknown evidence stays unknown and is never
                treated as proof that a place is inaccessible.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <strong className="block">Prototype data</strong>
              <span className="text-slate-200">
                No live venue or participant data
              </span>
            </div>
          </div>
        </header>

        <section
          aria-labelledby="discovery-controls-heading"
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              aria-hidden="true"
              className="h-5 w-5 text-[#005B7F]"
            />
            <h2 id="discovery-controls-heading" className="text-lg font-bold">
              Discovery controls
            </h2>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
            <label className="text-sm font-semibold">
              Search places
              <span className="relative mt-2 block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, suburb, city, or place type"
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-base outline-none focus:border-[#005B7F] focus:ring-2 focus:ring-[#005B7F]/25"
                />
              </span>
            </label>

            <label className="text-sm font-semibold">
              Capital city
              <select
                value={city}
                onChange={(event) =>
                  setCity(
                    event.target.value as (typeof SCAFFOLD_CITIES)[number],
                  )
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#005B7F] focus:ring-2 focus:ring-[#005B7F]/25"
              >
                {SCAFFOLD_CITIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">
              What matters for this journey?
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {SCAFFOLD_REQUIREMENTS.map((requirement) => {
                const pressed = activeRequirements.includes(requirement.key);
                return (
                  <button
                    key={requirement.key}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => toggleRequirement(requirement.key)}
                    className={
                      "min-h-11 rounded-full border px-4 text-sm font-semibold " +
                      (pressed
                        ? "border-[#005B7F] bg-[#005B7F] text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50")
                    }
                  >
                    {requirement.shortLabel}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-5">
            <label className="text-sm font-semibold">
              Unknown evidence
              <select
                value={unknownPolicy}
                onChange={(event) =>
                  setUnknownPolicy(
                    event.target.value as "show" | "prefer-known",
                  )
                }
                className="mt-2 block min-h-11 rounded-xl border border-slate-300 bg-white px-3"
              >
                <option value="show">Show unknowns neutrally</option>
                <option value="prefer-known">Prefer fewer unknowns</option>
              </select>
            </label>

            <div
              className="flex rounded-xl border border-slate-300 bg-white p-1"
              role="group"
              aria-label="Result presentation"
            >
              <button
                type="button"
                aria-pressed={presentation === "list"}
                onClick={() => setPresentation("list")}
                className={
                  "inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold " +
                  (presentation === "list"
                    ? "bg-[#0C1833] text-white"
                    : "text-slate-700 hover:bg-slate-50")
                }
              >
                <List aria-hidden="true" className="mr-2 h-4 w-4" />
                List
              </button>
              <button
                type="button"
                aria-pressed={presentation === "map"}
                onClick={() => setPresentation("map")}
                className={
                  "inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold " +
                  (presentation === "map"
                    ? "bg-[#0C1833] text-white"
                    : "text-slate-700 hover:bg-slate-50")
                }
              >
                <MapIcon aria-hidden="true" className="mr-2 h-4 w-4" />
                Map
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section aria-labelledby="results-heading" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#005B7F]">
                  National discovery
                </p>
                <h2 id="results-heading" className="mt-1 text-2xl font-black">
                  {filteredPlaces.length} place
                  {filteredPlaces.length === 1 ? "" : "s"}
                </h2>
              </div>
              <p
                className="max-w-md text-sm text-slate-600"
                role="status"
                aria-live="polite"
              >
                List and map use the same filtered result set.
              </p>
            </div>

            {presentation === "list" ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    selected={selectedPlace?.id === place.id}
                    activeRequirements={activeRequirements}
                    onSelect={() => setSelectedId(place.id)}
                  />
                ))}
              </div>
            ) : (
              <div
                className="relative mt-4 min-h-[520px] overflow-hidden rounded-3xl border border-slate-300 bg-[linear-gradient(135deg,#e8f3f7_25%,#f8fbfc_25%,#f8fbfc_50%,#e8f3f7_50%,#e8f3f7_75%,#f8fbfc_75%,#f8fbfc_100%)] bg-[length:40px_40px]"
                role="region"
                aria-label="Scaffold map presentation"
              >
                <div className="absolute inset-x-4 top-4 rounded-xl border border-[#005B7F]/20 bg-white/95 p-3 text-sm text-slate-700 shadow-sm">
                  UI scaffold map canvas only. It preserves result selection and
                  map/list parity but does not represent geographic distance or
                  routing.
                </div>

                {filteredPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => setSelectedId(place.id)}
                    aria-label={
                      "Select " + place.name + ", " + place.city
                    }
                    aria-pressed={selectedPlace?.id === place.id}
                    className={
                      "absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 text-xs font-black shadow-lg focus:outline-none focus:ring-4 focus:ring-[#F8C51C] " +
                      (selectedPlace?.id === place.id
                        ? "border-[#F8C51C] bg-[#0C1833] text-white"
                        : "border-white bg-[#005B7F] text-white")
                    }
                    style={{
                      left: place.mapPosition.x + "%",
                      top: place.mapPosition.y + "%",
                    }}
                  >
                    {place.city.slice(0, 2).toUpperCase()}
                  </button>
                ))}

                <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm">
                  Keyboard-operable marker scaffold · 44px minimum targets
                </div>
              </div>
            )}

            {filteredPlaces.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="font-bold">
                  No scaffold places match those filters
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Try another city or remove a search term. Access requirements
                  do not hide places merely because evidence is unknown.
                </p>
              </div>
            ) : null}
          </section>

          <aside
            className="self-start rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6"
            aria-labelledby="selected-place-heading"
          >
            {selectedPlace ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#005B7F]">
                  Selected place
                </p>
                <h2
                  id="selected-place-heading"
                  className="mt-1 text-2xl font-black"
                >
                  {selectedPlace.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPlace.suburb}, {selectedPlace.state}
                </p>

                <div className="mt-4">
                  <EvidenceBadge place={selectedPlace} />
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedPlace.evidenceNote}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedPlace.updatedLabel}
                  </p>
                </div>

                <section className="mt-5 border-t border-slate-200 pt-5">
                  <h3 className="font-bold">Access requirements</h3>
                  <dl className="mt-3 space-y-3">
                    {SCAFFOLD_REQUIREMENTS.map((requirement) => (
                      <div
                        key={requirement.key}
                        className="flex items-center justify-between gap-3"
                      >
                        <dt className="text-sm text-slate-700">
                          {requirement.label}
                        </dt>
                        <dd>
                          <AccessStateBadge
                            state={
                              selectedPlace.requirements[requirement.key]
                            }
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="mt-5 rounded-2xl bg-[#F0F8FB] p-4">
                  <h3 className="font-bold text-[#004766]">
                    Evidence principle
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Unknown means the scaffold does not have strong enough
                    evidence yet. It does not mean the feature is absent.
                  </p>
                </section>

                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-semibold text-white hover:bg-[#004766]"
                  >
                    View full access details
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#0C1833] hover:bg-slate-50"
                  >
                    Report a change
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                Select a result to inspect its access evidence.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
