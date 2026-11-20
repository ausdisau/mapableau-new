import Link from "next/link";

import { searchDomainDirectory } from "@/lib/search/domain-directory-service";
import {
  categoriesForDomain,
  directoryCategory,
  type DirectoryDomain,
} from "@/lib/search/domain-directory-taxonomy";

export type DirectorySearchParams = {
  q?: string;
  category?: string;
  state?: string;
  postcode?: string;
};

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;

const COPY = {
  jobs: {
    eyebrow: "MapAble Employment",
    title: "Employment directory and opportunity marketplace",
    description:
      "Search employer-published roles and imported employment-support services. Your application, disability information and adjustment requests stay under your control.",
    termExample: "Job title, employer or employment support",
    fallback: "/employment",
    fallbackText: "Employment overview",
  },
  rehabilitation: {
    eyebrow: "MapAble Moves",
    title: "Rehabilitation and allied-health directory",
    description:
      "Explore therapy-related provider directory entries by discipline and location. Find a service to contact and independently verify its qualifications, suitability and availability.",
    termExample: "Physiotherapy, occupational therapy or provider name",
    fallback: "/moves",
    fallbackText: "Moves overview",
  },
} as const;

function buildSearchLink(
  domain: DirectoryDomain,
  params: { q: string; category: string; state?: string; postcode?: string },
): string {
  const query = new URLSearchParams({ vertical: domain });
  if (params.q) query.set("q", params.q);
  if (params.category !== "all") query.set("category", params.category);
  if (params.state) query.set("state", params.state);
  if (params.postcode) query.set("postcode", params.postcode);
  return "/search?" + query.toString();
}

export async function DomainDirectoryPage({
  domain,
  searchParams,
}: {
  domain: DirectoryDomain;
  searchParams: DirectorySearchParams;
}) {
  const q = (searchParams.q ?? "").trim().slice(0, 180);
  const category = directoryCategory(domain, searchParams.category);
  const state = STATES.find((item) => item === searchParams.state);
  const postcode = /^\d{4}$/.test(searchParams.postcode ?? "")
    ? searchParams.postcode
    : undefined;
  const response = await searchDomainDirectory({
    domain,
    q,
    vertical: domain,
    category: category.id,
    state,
    postcode,
  });
  const copy = COPY[domain];
  const categories = categoriesForDomain(domain);
  const searchHref = buildSearchLink(domain, {
    q, category: category.id, state, postcode,
  });

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
          {copy.eyebrow} · Source-labelled directory preview
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          {copy.title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          {copy.description}
        </p>
        <p className="max-w-3xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
          Discovery only. Listings are source-dependent and may be unavailable.
          Directory inclusion does not verify practitioner registration, current
          NDIS registration, worker screening, prices, vacancies, accessible premises,
          clinical suitability, outcome claims or funding eligibility.
        </p>
      </header>

      <form
        action={domain === "jobs" ? "/employment/directory" : "/moves/directory"}
        method="get"
        role="search"
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <div>
          <label htmlFor="directory-query" className="block font-semibold">Search term</label>
          <input
            id="directory-query"
            name="q"
            type="search"
            maxLength={180}
            defaultValue={q}
            placeholder={copy.termExample}
            className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="directory-category" className="block text-sm font-semibold">
              Service category
            </label>
            <select
              id="directory-category"
              name="category"
              defaultValue={category.id}
              className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground"
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="directory-state" className="block text-sm font-semibold">
              State or territory
            </label>
            <select
              id="directory-state"
              name="state"
              defaultValue={state ?? ""}
              className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground"
            >
              <option value="">Any state</option>
              {STATES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="directory-postcode" className="block text-sm font-semibold">
              Postcode
            </label>
            <input
              id="directory-postcode"
              name="postcode"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              defaultValue={postcode ?? ""}
              placeholder="Optional"
              className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Search {domain === "jobs" ? "employment" : "rehabilitation"}
        </button>
        <p className="text-sm text-muted-foreground">
          No diagnosis or medical history is required. Searches remain within
          MapAble&apos;s approved local indexes; no external AI or crawler is invoked.
        </p>
      </form>

      <nav aria-label="Explore related services" className="flex flex-wrap gap-3">
        <Link href={searchHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
          Open these filters in MapAble Search
        </Link>
        <Link href={copy.fallback}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 underline underline-offset-4">
          {copy.fallbackText}
        </Link>
        {domain === "jobs" ? (
          <Link href="/dashboard/jobs" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 underline underline-offset-4">
            Existing Jobs dashboard
          </Link>
        ) : (
          <Link href="/transport" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 underline underline-offset-4">
            Plan related transport
          </Link>
        )}
      </nav>

      <section aria-labelledby="directory-results-heading" className="space-y-4">
        <div>
          <h2 id="directory-results-heading" className="font-heading text-2xl font-bold">
            Directory results
          </h2>
          <p role="status" className="text-sm text-muted-foreground">
            {response.results.length} source-labelled {response.results.length === 1 ? "result" : "results"} in this preview.
            Lists are capped at 30 per enabled source, not a complete national census.
          </p>
        </div>
        {response.results.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {response.results.map((hit) => (
              <li key={hit.id} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {hit.kind === "published_job" ? "Employer-published job" : "Imported provider directory outlet"}
                </p>
                <h3 className="mt-2 text-lg font-semibold">
                  <Link
                    href={hit.href}
                    className="rounded underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  >{hit.title}</Link>
                </h3>
                <p className="mt-2 text-sm leading-6">{hit.description}</p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Source: {hit.sourceLabel}
                </p>
                {hit.directoryUpdatedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Local record updated: {hit.directoryUpdatedAt.slice(0, 10)}
                  </p>
                ) : null}
                <p className="mt-3 text-sm font-medium">
                  {hit.kind === "published_job"
                    ? "Job conditions and adjustments require employer confirmation."
                    : "Verification, access details and availability: unknown."}
                </p>
                <Link
                  href={hit.href}
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  {hit.kind === "published_job" ? "Review published role" : "Review provider directory"}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div role="status" className="rounded-xl border border-border bg-card p-5">
            <p className="font-semibold">No listings available from the enabled sources for these filters.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This does not mean there are no suitable services or jobs.
              Broaden your filters or use the existing Provider Finder.
            </p>
            <Link href="/provider-finder" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Open Provider Finder
            </Link>
          </div>
        )}
      </section>

      <aside aria-labelledby="directory-limits" className="space-y-2 rounded-xl border border-border p-5">
        <h2 id="directory-limits" className="font-semibold">Source and safety limitations</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-6">
          {Array.from(new Set(response.warnings)).map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
        <p className="text-sm">
          {domain === "jobs"
            ? "You decide whether and when to disclose disability or request workplace adjustments. A public listing is not an application."
            : "A directory listing is not clinical advice. Practitioner registration, qualifications and rehabilitation suitability require independent checks."}
        </p>
        <p className="text-sm">
          <Link href="/contact" className="font-semibold underline underline-offset-4">
            Contact MapAble for help or to report an incorrect listing
          </Link>
        </p>
      </aside>
    </main>
  );
}
