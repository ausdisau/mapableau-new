"use client";

import { Download, List, Map as MapIcon, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MapErrorBoundary } from "@/components/error/MapErrorBoundary";
import type { CouncilBoundarySource } from "@/lib/access/community-infrastructure/council-types";
import type {
  CommunityAreaId,
  CommunityCategory,
  CommunityInfrastructureCollection,
  CommunityInfrastructureFeature,
  WheelchairStatus,
} from "@/lib/access/community-infrastructure/types";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

import {
  CommunityCouncilInformation,
  CouncilJurisdictionEvidence,
  CouncilJurisdictionSummary,
} from "./CommunityCouncilInformation";
import { CommunityInfrastructureSymbol } from "./CommunityInfrastructureSymbol";
import {
  COMMUNITY_AREA_LABELS,
  COMMUNITY_CATEGORY_LABELS,
  COMMUNITY_WHEELCHAIR_LABELS,
  communityDateLabel,
} from "./presentation";

const CommunityInfrastructureMap = dynamic(
  () => import("./CommunityInfrastructureMap"),
  {
    ssr: false,
    loading: () => (
      <p
        className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-6"
        role="status"
      >
        Loading map. The same places are available in the list below.
      </p>
    ),
  },
);

const LIST_PAGE_SIZE = 40;
const selectClass = `mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base ${mapableInteractiveFocusRing}`;

function InfrastructureCard({
  feature,
  index,
  selected,
  setRef,
  boundarySource,
}: {
  feature: CommunityInfrastructureFeature;
  index: number;
  selected: boolean;
  setRef: (element: HTMLElement | null) => void;
  boundarySource?: CouncilBoundarySource;
}) {
  const { properties } = feature;
  const { source } = properties;

  return (
    <article
      ref={setRef}
      tabIndex={-1}
      aria-labelledby={`community-title-${feature.id}`}
      className={`rounded-2xl border bg-white p-5 ${selected ? "border-[#005B7F] ring-2 ring-[#005B7F]" : "border-slate-200"} ${mapableInteractiveFocusRing}`}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F6FBFC] text-[#005B7F]"
          aria-hidden="true"
        >
          <CommunityInfrastructureSymbol category={properties.category} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#005B7F]">
            {index + 1} · {COMMUNITY_CATEGORY_LABELS[properties.category]}
          </p>
          <h3
            id={`community-title-${feature.id}`}
            className="mt-1 break-words text-xl font-bold leading-snug"
          >
            {properties.name}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Source report · Not independently verified
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Data retrieved {communityDateLabel(source.retrievedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#F6FBFC] p-3">
        <p className="text-sm font-semibold">Wheelchair access tag</p>
        <p className="mt-1 text-sm">
          {COMMUNITY_WHEELCHAIR_LABELS[properties.wheelchair]}
        </p>
        {properties.wheelchair === "designated" ? (
          <p className="mt-1 text-sm text-slate-600">
            Designation does not establish present physical access.
          </p>
        ) : null}
      </div>

      {properties.accessFacts.length ? (
        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          {properties.accessFacts.map((fact) => (
            <div
              key={fact.key}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 py-2"
            >
              <dt className="font-semibold text-slate-600">{fact.label}</dt>
              <dd className="break-words">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          No detailed access measurements are recorded in this source.
        </p>
      )}

      {properties.unknownAttributes.length > 0 ? (
        <details className="mt-4 rounded-xl border border-slate-200 px-3 text-sm">
          <summary
            className={`min-h-11 cursor-pointer rounded-lg py-3 font-semibold ${mapableInteractiveFocusRing}`}
          >
            Missing access details ({properties.unknownAttributes.length})
          </summary>
          <p className="mb-2 text-slate-600">
            These details are unrecorded, not recorded as absent.
          </p>
          <ul className="mb-3 list-disc space-y-1 pl-5">
            {properties.unknownAttributes.map((attribute) => (
              <li key={attribute}>{attribute}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="mt-4 flex items-start gap-2 text-sm text-slate-600">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {properties.geometryRole === "approximate_bbox_centre"
            ? "Approximate area marker — not an entrance or an individual bay location."
            : "Mapped point — the approach and entrance have not been checked by MapAble."}
        </span>
      </p>

      <CouncilJurisdictionSummary
        jurisdiction={properties.councilJurisdiction}
        approximate={properties.geometryRole === "approximate_bbox_centre"}
      />

      <details className="mt-4 border-t border-slate-200 pt-2 text-sm">
        <summary
          className={`min-h-11 cursor-pointer rounded-lg py-3 font-semibold ${mapableInteractiveFocusRing}`}
        >
          Source and evidence dates
        </summary>
        <dl className="space-y-2 py-2">
          <div>
            <dt className="font-semibold">Data retrieved</dt>
            <dd>{communityDateLabel(source.retrievedAt)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Source record edited</dt>
            <dd>{communityDateLabel(source.sourceUpdatedAt)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Source check date</dt>
            <dd>{communityDateLabel(source.checkedAt)}</dd>
          </div>
          {source.checkedScope ? (
            <div>
              <dt className="font-semibold">Check scope</dt>
              <dd>{source.checkedScope}</dd>
            </div>
          ) : null}
          <CouncilJurisdictionEvidence
            jurisdiction={properties.councilJurisdiction}
            boundarySource={boundarySource}
          />
        </dl>
        <p className="text-slate-600">
          Retrieval and edit dates are not access inspection dates. A source
          check may cover only the feature named above.
        </p>
        <a
          href={source.url}
          className={`mt-2 inline-flex min-h-11 items-center rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 ${mapableInteractiveFocusRing}`}
        >
          View this OpenStreetMap record
        </a>
        <p className="mt-1 text-xs text-slate-600">
          {source.attribution} · {source.licence}
        </p>
      </details>
    </article>
  );
}

export function CommunityInfrastructureExplorer() {
  const [area, setArea] = useState<CommunityAreaId>("parramatta");
  const [category, setCategory] = useState<CommunityCategory | "all">("all");
  const [wheelchair, setWheelchair] = useState<WheelchairStatus | "all">("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<CommunityInfrastructureCollection | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [listLimit, setListLimit] = useState(LIST_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cards = useRef(new Map<string, HTMLElement>());

  const query = useMemo(
    () => new URLSearchParams({ area, category, wheelchair }).toString(),
    [area, category, wheelchair],
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    setError(null);
    setData(null);
    setSelectedId(null);
    setListLimit(LIST_PAGE_SIZE);

    void fetch(`/api/access/community-infrastructure?${query}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Request failed");
        const collection =
          (await response.json()) as CommunityInfrastructureCollection;
        if (
          collection.type !== "FeatureCollection" ||
          !Array.isArray(collection.features) ||
          !collection.meta
        ) {
          throw new Error("Invalid collection");
        }
        if (active) setData(collection);
      })
      .catch(() => {
        if (active)
          setError(
            "The source records could not be loaded. This does not mean there are no facilities in this area.",
          );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, retry]);

  const selectFeature = useCallback(
    (id: string) => {
      const index =
        data?.features.findIndex((feature) => feature.id === id) ?? -1;
      if (index < 0) return;
      setListLimit((current) => Math.max(current, index + 1));
      setSelectedId(id);
      const existingCard = cards.current.get(id);
      existingCard?.focus({ preventScroll: true });
      existingCard?.scrollIntoView?.({ block: "nearest", behavior: "auto" });
    },
    [data],
  );

  useEffect(() => {
    if (!selectedId) return;
    const card = cards.current.get(selectedId);
    card?.focus({ preventScroll: true });
    card?.scrollIntoView?.({ block: "nearest", behavior: "auto" });
  }, [selectedId, listLimit]);

  const features = data?.features ?? [];
  const shown = features.slice(0, listLimit);

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <Link
            href="/accessibility-map"
            className={`inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-[#005B7F] underline underline-offset-4 ${mapableInteractiveFocusRing}`}
          >
            Accessibility Map
          </Link>
          <p className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
            Community infrastructure
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.04em] md:text-5xl">
            More detail for your next visit.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            Explore parking, toilets and public spaces. Review the access
            details recorded for each place, what remains unknown and where the
            information came from.
          </p>
          <p className="mt-4 max-w-3xl rounded-xl border border-[#005B7F]/20 bg-white p-4 text-sm leading-6">
            These are source reports, not a MapAble access assessment. A parking
            designation or wheelchair tag does not confirm a usable route,
            current availability or suitability for your needs.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
        <aside
          aria-label="Community infrastructure filters"
          className="space-y-5"
        >
          <fieldset className="rounded-2xl border border-slate-200 p-5">
            <legend className="px-1 font-bold">Choose what to explore</legend>
            <div>
              <label htmlFor="community-area" className="text-sm font-semibold">
                Study area
              </label>
              <select
                id="community-area"
                value={area}
                onChange={(event) =>
                  setArea(event.target.value as CommunityAreaId)
                }
                className={selectClass}
                aria-describedby="community-area-note"
              >
                {Object.entries(COMMUNITY_AREA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p
                id="community-area-note"
                className="mt-2 text-xs leading-5 text-slate-600"
              >
                Bounded Western Sydney study windows, not council boundaries or
                complete coverage.
              </p>
            </div>
            <div className="mt-5">
              <label
                htmlFor="community-category"
                className="text-sm font-semibold"
              >
                Type of place
              </label>
              <select
                id="community-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as CommunityCategory | "all")
                }
                className={selectClass}
              >
                <option value="all">All types</option>
                {Object.entries(COMMUNITY_CATEGORY_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="mt-5">
              <label
                htmlFor="community-wheelchair"
                className="text-sm font-semibold"
              >
                Wheelchair access tag
              </label>
              <select
                id="community-wheelchair"
                value={wheelchair}
                onChange={(event) =>
                  setWheelchair(event.target.value as WheelchairStatus | "all")
                }
                className={selectClass}
                aria-describedby="community-unknown-note"
              >
                <option value="all">All, including unknown</option>
                {Object.entries(COMMUNITY_WHEELCHAIR_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <p
                id="community-unknown-note"
                className="mt-2 text-xs leading-5 text-slate-600"
              >
                Unknown means a tag is missing. It does not mean the place is
                inaccessible.
              </p>
            </div>
          </fieldset>

          <CommunityCouncilInformation
            linkage={data?.meta.councilLinkage}
            areaLabel={COMMUNITY_AREA_LABELS[area]}
            category={category}
            loading={loading}
          />

          <div className="rounded-2xl bg-[#F6FBFC] p-5 text-sm leading-6">
            <h2 className="font-bold">What to check before a visit</h2>
            <p className="mt-2 text-slate-700">
              Look for transfer space, entrance details, opening restrictions
              and the path between facilities. Missing details remain unknown.
            </p>
            <p className="mt-3 text-slate-700">
              A mapped park or garden may have restricted entry. Its category
              does not establish public access.
            </p>
            <p className="mt-3 text-slate-700">
              An adult change table, a hoist and a Changing Places facility are
              separate features. A standard changing-table tag does not
              establish any of them.
            </p>
            <a
              href="https://toiletmap.gov.au/"
              className={`mt-3 inline-flex min-h-11 items-center rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 ${mapableInteractiveFocusRing}`}
            >
              Search the National Public Toilet Map
            </a>
            <p className="mt-1 text-slate-700">
              Check additional facility details in the national directory.
            </p>
          </div>
        </aside>

        <section className="min-w-0" aria-labelledby="community-results-title">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="community-results-title" className="text-2xl font-bold">
                {COMMUNITY_AREA_LABELS[area]} source records
              </h2>
              <p
                className="mt-1 text-sm text-slate-600"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {loading
                  ? "Loading source records…"
                  : error
                    ? "Source records unavailable."
                    : data?.meta.dataStatus === "not_loaded"
                      ? "Source coverage has not been loaded."
                      : `${features.length} mapped record${features.length === 1 ? "" : "s"} match your filters.`}
              </p>
            </div>
            <div
              role="group"
              aria-label="Results view"
              className="inline-flex rounded-xl border border-slate-300 bg-white p-1"
            >
              <button
                type="button"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold ${view === "list" ? "bg-[#005B7F] text-white" : "text-[#005B7F]"} ${mapableInteractiveFocusRing}`}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                List
              </button>
              <button
                type="button"
                aria-pressed={view === "map"}
                onClick={() => setView("map")}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold ${view === "map" ? "bg-[#005B7F] text-white" : "text-[#005B7F]"} ${mapableInteractiveFocusRing}`}
              >
                <MapIcon className="h-4 w-4" aria-hidden="true" />
                Map + list
              </button>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((current) => current + 1)}
                className={`mt-3 min-h-11 rounded-xl border border-amber-900 px-4 font-semibold ${mapableInteractiveFocusRing}`}
              >
                Try again
              </button>
            </div>
          ) : null}

          {data ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {data.meta.notice}
            </p>
          ) : null}
          {data?.meta.truncated ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
              Showing {features.length} of {data.meta.totalMatched} matching
              records. Narrow the filters to inspect the remaining records.
            </p>
          ) : null}

          {view === "map" && data && features.length > 0 ? (
            <div className="mt-5">
              <a
                href="#community-results-list"
                className={`inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-[#005B7F] underline ${mapableInteractiveFocusRing}`}
              >
                Skip map to the same places in a list
              </a>
              <MapErrorBoundary
                fallback={
                  <p
                    role="status"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-4"
                  >
                    The map could not load. The same source records remain in
                    the list below.
                  </p>
                }
              >
                <CommunityInfrastructureMap
                  features={features}
                  onSelect={selectFeature}
                />
              </MapErrorBoundary>
            </div>
          ) : null}

          {!loading &&
          !error &&
          data?.meta.dataStatus === "source_snapshot" &&
          features.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-slate-200 p-6 text-slate-700">
              No source records match these filters. Try another tag or type of
              place. Incomplete mapping is not evidence that facilities are
              absent.
            </p>
          ) : null}

          <div
            id="community-results-list"
            tabIndex={-1}
            className={`mt-5 rounded-xl ${mapableInteractiveFocusRing}`}
          >
            <ul
              aria-label="Community infrastructure results"
              className="grid gap-4 xl:grid-cols-2"
            >
              {shown.map((feature, index) => (
                <li key={feature.id}>
                  <InfrastructureCard
                    feature={feature}
                    index={index}
                    selected={selectedId === feature.id}
                    boundarySource={data?.meta.councilLinkage?.boundarySource}
                    setRef={(element) => {
                      if (element) cards.current.set(feature.id, element);
                      else cards.current.delete(feature.id);
                    }}
                  />
                </li>
              ))}
            </ul>
            {features.length > shown.length ? (
              <button
                type="button"
                onClick={() =>
                  setListLimit((current) => current + LIST_PAGE_SIZE)
                }
                className={`mt-5 min-h-12 rounded-xl border border-slate-300 px-5 font-semibold ${mapableInteractiveFocusRing}`}
              >
                Show more places ({features.length - shown.length} remaining)
              </button>
            ) : null}
          </div>

          {data && data.meta.dataStatus === "source_snapshot" ? (
            <footer className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <a
                href={`/api/access/community-infrastructure?${query}&format=geojson`}
                download
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 ${mapableInteractiveFocusRing}`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download these records as GeoJSON
              </a>
              <p className="mt-2">{data.meta.attribution}</p>
              <a
                href="https://www.openstreetmap.org/copyright"
                className={`inline-flex min-h-11 items-center rounded-lg underline underline-offset-4 ${mapableInteractiveFocusRing}`}
              >
                OpenStreetMap data licence and attribution
              </a>
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}
