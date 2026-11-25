import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type {
  MapAbleSearchHit,
  MapAbleSearchResponse,
} from "@/lib/search/mapable-search-core";
import {
  evidenceStatusForHit,
  organicResultsIgnoringAds,
  type SearchAdSlot,
  type SearchEvidenceStatus,
  type SearchUiStatus,
} from "@/lib/search/mapable-search-ui";

const STATUS_LABEL: Record<SearchEvidenceStatus, string> = {
  verified: "Verified",
  reported: "Reported",
  historical: "Historical",
  disputed: "Disputed",
  unknown: "Unknown",
};

type Props = {
  response?: MapAbleSearchResponse | null;
  status: SearchUiStatus;
  ads?: SearchAdSlot[];
  className?: string;
};

function ResultCard({ hit }: { hit: MapAbleSearchHit }) {
  const evidence = evidenceStatusForHit(hit);
  const kindLabel =
    hit.kind === "module" ? "MapAble destination" : "Provider directory outlet";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#005B7F]">
        {hit.vertical} · {kindLabel}
      </p>
      <h3 className="font-heading text-lg font-bold text-[#0C1833]">
        <Link
          href={hit.href}
          className={cn(
            "underline underline-offset-4 hover:text-[#005B7F]",
            mapableCareFocusRing,
          )}
        >
          {hit.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-[#0C1833]/90">{hit.description}</p>
      <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[#0C1833]">Evidence status</dt>
          <dd>{STATUS_LABEL[evidence]}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0C1833]">Source</dt>
          <dd>
            {hit.sourceUrl ? (
              <a href={hit.sourceUrl} className="underline" rel="noreferrer">
                {hit.sourceLabel}
              </a>
            ) : (
              hit.sourceLabel
            )}
          </dd>
        </div>
        {hit.directoryUpdatedAt ? (
          <div>
            <dt className="font-semibold text-[#0C1833]">
              Local record updated
            </dt>
            <dd>{hit.directoryUpdatedAt.slice(0, 10)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold text-[#0C1833]">Access fit</dt>
          <dd>
            {hit.accessFit === "unknown"
              ? "Unknown — not assigned a universal accessibility rating"
              : hit.accessFit}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0C1833]">Registration</dt>
          <dd>
            {hit.registration === "not_independently_verified"
              ? "Not independently verified"
              : hit.registration}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#0C1833]">Worker screening</dt>
          <dd>
            {hit.workerScreening === "not_independently_verified"
              ? "Not independently verified"
              : hit.workerScreening}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={hit.href}
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white hover:bg-[#004766]",
            mapableCareFocusRing,
          )}
        >
          Open {hit.title}
        </Link>
        <Link
          href="/contact"
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black text-[#0C1833] hover:bg-slate-50",
            mapableCareFocusRing,
          )}
        >
          Ask for human help
        </Link>
        <Link
          href="/contact"
          className={cn(
            "inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#005B7F] underline",
            mapableCareFocusRing,
          )}
        >
          Suggest a correction
        </Link>
      </div>
    </article>
  );
}

function AdSlot({ ad }: { ad: SearchAdSlot }) {
  return (
    <aside
      aria-label="Advertisement"
      className="rounded-2xl border border-dashed border-slate-300 bg-[#F6FBFC] p-4"
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {ad.label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#0C1833]">
        Paid for by {ad.paidForBy}
      </p>
      <p className="mt-2 text-sm text-slate-600">{ad.summary}</p>
      <a
        href={ad.href}
        className={cn(
          "mt-3 inline-flex min-h-11 items-center text-sm font-black text-[#005B7F] underline",
          mapableCareFocusRing,
        )}
      >
        View advertiser content
      </a>
    </aside>
  );
}

export function MapAbleSearchResults({
  response,
  status,
  ads = [],
  className,
}: Props) {
  const organic = organicResultsIgnoringAds(response?.results ?? [], ads);

  return (
    <section
      aria-labelledby="search-results-heading"
      className={cn("space-y-4", className)}
    >
      <div className="space-y-1">
        <h2
          id="search-results-heading"
          className="font-heading text-2xl font-bold text-[#0C1833]"
        >
          Search results
        </h2>
        <p role="status" className="text-sm text-slate-600">
          {status === "loading"
            ? "Searching MapAble…"
            : status === "no_match"
              ? "No matching results in the enabled public index."
              : status === "partial_data"
                ? `${response?.resultCount ?? 0} results with partial data.`
                : status === "results"
                  ? `${response?.resultCount ?? 0} results. ${
                      response?.sourceState === "navigation_only"
                        ? "Showing MapAble navigation — not a full web index."
                        : response?.sourceState === "imported_provider_index"
                          ? "Includes imported provider directory records."
                          : "Showing available results."
                    }`
                  : "Enter a search to explore MapAble destinations."}
        </p>
      </div>

      {status === "loading" ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-5 text-sm"
        >
          Loading results…
        </div>
      ) : null}

      {status === "no_match" ? (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          No matching results in the enabled public index. Try a different term
          or open{" "}
          <Link href="/provider-finder" className="font-semibold underline">
            Provider Finder
          </Link>
          . This is not evidence that no suitable service exists.
        </div>
      ) : null}

      {organic.length > 0 ? (
        <ul className="space-y-3">
          {organic.map((hit) => (
            <li key={hit.id}>
              <ResultCard hit={hit} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
          Advertisements
        </h3>
        <p className="text-xs text-slate-500">
          Paid placements are separate from organic results and cannot change
          ranking or evidence labels. Search queries and access needs are never
          sent to advertising partners from this page.
        </p>
        {ads.length > 0 ? (
          ads.map((ad) => <AdSlot key={ad.id} ad={ad} />)
        ) : (
          <aside
            aria-label="Advertisement"
            className="rounded-2xl border border-dashed border-slate-300 bg-[#F6FBFC] p-4"
          >
            <p className="text-sm font-semibold text-[#0C1833]">
              Advertisement — placement unavailable
            </p>
            <p className="mt-1 text-sm text-slate-600">
              No approved MapAble Search ad surface is live. Organic results and
              evidence labels are never sold.
            </p>
          </aside>
        )}
      </div>
    </section>
  );
}
