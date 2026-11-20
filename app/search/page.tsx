import type { Metadata } from "next";
import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { searchMapAble } from "@/lib/search/mapable-search-service";
import {
  categoriesForDomain,
  isValidCategoryFilter,
} from "@/lib/search/domain-directory-taxonomy";
import type { MapAbleVertical } from "@/lib/search/mapable-search-core";

export const metadata: Metadata = {
  title: "MapAble Search | Find disability services, transport and work",
  description: "Search MapAble's disability-focused service areas and source-labelled provider directory records.",
  alternates: canonicalAlternate("/search"),
};

const verticals = [
  ["all", "Everything"],
  ["providers", "Providers"],
  ["care", "Care"],
  ["transport", "Transport"],
  ["jobs", "Employment and jobs"],
  ["rehabilitation", "Rehabilitation and therapy"],
] as const;

const validVerticals = new Set<MapAbleVertical>(verticals.map(([id]) => id));
const states = new Set(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]);

type Params = { q?: string; vertical?: string; state?: string; postcode?: string; category?: string };

export default async function MapAbleSearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 180);
  const vertical = validVerticals.has(params.vertical as MapAbleVertical)
    ? (params.vertical as MapAbleVertical)
    : "all";
  const state = states.has(params.state ?? "") ? params.state : undefined;
  const postcode = /^\d{4}$/.test(params.postcode ?? "") ? params.postcode : undefined;
  const category = isValidCategoryFilter(vertical, params.category)
    ? (params.category ?? undefined)
    : undefined;
  const response = await searchMapAble({ q: query, vertical, state, postcode, category });

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Australian Disability Ltd · MapAble
        </p>
        <h1 className="font-heading text-4xl font-bold">MapAble Search</h1>
        <p className="max-w-3xl text-lg">
          Find what you need. Know what is verified. Stay in control.
          Explore providers, care, transport, employment and rehabilitation pathways in one place.
        </p>
      </header>

      <form method="get" action="/search" role="search" className="space-y-4 rounded-xl border bg-card p-5">
        <div className="space-y-2">
          <label htmlFor="search-q" className="block font-semibold">What are you looking for?</label>
          <input
            id="search-q"
            name="q"
            type="search"
            maxLength={180}
            defaultValue={query}
            placeholder="e.g. employment support, physiotherapy, accessible transport"
            className="min-h-12 w-full rounded-lg border bg-background px-4 text-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-40 flex-1 space-y-1">
            <label htmlFor="search-vertical" className="block text-sm font-semibold">Category</label>
            <select
              id="search-vertical"
              name="vertical"
              defaultValue={vertical}
              className="min-h-11 w-full rounded-lg border bg-background px-3"
            >
              {verticals.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div className="min-w-40 flex-1 space-y-1">
            <label htmlFor="search-category" className="block text-sm font-semibold">Type of service (optional)</label>
            <select
              id="search-category"
              name="category"
              defaultValue={category ?? ""}
              className="min-h-11 w-full rounded-lg border bg-background px-3"
            >
              <option value="">All service types</option>
              <optgroup label="Employment">
                {categoriesForDomain("jobs").filter((item) => item.id !== "all").map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </optgroup>
              <optgroup label="Rehabilitation">
                {categoriesForDomain("rehabilitation").filter((item) => item.id !== "all").map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-muted-foreground">Choose the corresponding Employment or Rehabilitation area when filtering by service type.</p>
          </div>
          <div className="min-w-32 flex-1 space-y-1">
            <label htmlFor="search-state" className="block text-sm font-semibold">State (optional)</label>
            <select id="search-state" name="state" defaultValue={state ?? ""} className="min-h-11 w-full rounded-lg border bg-background px-3">
              <option value="">Any state</option>
              {Array.from(states).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div className="min-w-32 flex-1 space-y-1">
            <label htmlFor="search-postcode" className="block text-sm font-semibold">Postcode (optional)</label>
            <input id="search-postcode" name="postcode" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
              defaultValue={postcode ?? ""} className="min-h-11 w-full rounded-lg border bg-background px-3" />
          </div>
        </div>
        <button type="submit" className="min-h-12 rounded-lg bg-primary px-6 font-semibold text-primary-foreground">
          Search MapAble
        </button>
        <p className="text-sm text-muted-foreground">
          No diagnosis or account is required for this public discovery view. MapAble does not send these searches to Exa or Parallel in this pilot.
        </p>
      </form>

      <nav aria-label="Browse specialist directories" className="flex flex-wrap gap-3">
        <Link href="/employment/directory" className="inline-flex min-h-11 items-center rounded-lg border bg-card px-4 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
          Browse Employment directory
        </Link>
        <Link href="/moves/directory" className="inline-flex min-h-11 items-center rounded-lg border bg-card px-4 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
          Browse Rehabilitation directory
        </Link>
      </nav>

      <section aria-labelledby="search-results-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="search-results-heading" className="font-heading text-2xl font-bold">
            Search results
          </h2>
          <p role="status" className="text-sm text-muted-foreground">
            {response.resultCount} results. {response.sourceState === "navigation_only"
              ? "Showing MapAble navigation."
              : response.sourceState === "partial"
                ? "Some sources are unavailable; showing partial results."
                : response.sourceState === "directory_results"
                  ? "Includes source-labelled directory records or approved published jobs."
                  : "Includes imported provider directory records."}
          </p>
        </div>
        {response.results.length ? (
          <ul className="space-y-3">
            {response.results.map((hit) => (
              <li key={hit.id} className="rounded-xl border bg-card p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{hit.vertical} · {hit.kind === "module" ? "MapAble module" : hit.kind === "published_job" ? "Employer-published vacancy" : "Imported provider directory outlet"}</p>
                <h3 className="text-lg font-semibold">
                  <Link href={hit.href} className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
                    {hit.title}
                  </Link>
                </h3>
                <p className="mt-2">{hit.description}</p>
                <p className="mt-2 text-sm text-muted-foreground">Source: {hit.sourceLabel}</p>
                {hit.directoryUpdatedAt ? <p className="text-sm text-muted-foreground">Local record updated: {hit.directoryUpdatedAt.slice(0, 10)}</p> : null}
                {hit.kind === "provider_outlet" ? (
                  <p className="mt-2 text-sm">Current registration, professional credentials, worker screening, access fit and availability: not independently verified.</p>
                ) : null}
                {hit.kind === "published_job" ? (
                  <p className="mt-2 text-sm">Employer-supplied vacancy; adjustment, pay and accessibility information require direct confirmation. Applying may require sign-in.</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div role="status" className="rounded-lg border p-5">
            No matching results in the enabled public index. Try a different term or open{" "}
            <Link href="/provider-finder" className="underline">Provider Finder</Link>.
            This is not evidence that no suitable provider exists.
          </div>
        )}
      </section>

      <aside aria-label="Search limitations" className="space-y-2 rounded-lg border p-5">
        <h2 className="font-semibold">What these results can and cannot confirm</h2>
        {response.warnings.map((warning) => <p key={warning} className="text-sm">{warning}</p>)}
        <p className="text-sm">
          Check the <a className="underline" href="https://www.ndiscommission.gov.au/provider-registration/find-registered-provider">NDIS Commission Provider Register</a> for current registration.
          Worker screening can only be checked through an authorised process.
        </p>
      </aside>
    </main>
  );
}
