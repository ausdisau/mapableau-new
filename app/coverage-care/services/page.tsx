import Link from "next/link";

import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";
import { listCoverageCareServices } from "@/lib/coverage-care/listing-service";

export default async function CoverageCareServicesPage({
  searchParams,
}: {
  searchParams?: Promise<{ discipline?: string; region?: string }>;
}) {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }

  const resolved = (await searchParams) ?? {};
  const listings = listCoverageCareServices({
    discipline: resolved.discipline,
    regionQuery: resolved.region,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
          Allied-health service directory
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[color:var(--cc-ink)]/80">
          Accessible proposed directory for the Coverage Care pilot. Every
          listing is labelled synthetic demo data — not verified NDIS
          registration, practitioner credential, or live availability.
        </p>
      </header>

      <form
        className="mt-8 grid gap-4 rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"
        method="get"
        role="search"
        aria-label="Filter services"
      >
        <label className="block text-sm font-medium">
          Discipline
          <input
            name="discipline"
            defaultValue={resolved.discipline ?? ""}
            className="mt-1 min-h-11 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          />
        </label>
        <label className="block text-sm font-medium">
          Region
          <input
            name="region"
            defaultValue={resolved.region ?? ""}
            className="mt-1 min-h-11 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)] sm:w-auto"
          >
            Apply filters
          </button>
        </div>
      </form>

      <ul className="mt-8 space-y-4" aria-label="Service listings">
        {listings.map((listing) => (
          <li
            key={listing.id}
            className="rounded-md border border-[color:var(--cc-sage)]/25 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[color:var(--cc-olive)]">
                  {listing.title}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--cc-ink)]/70">
                  {listing.discipline} · {listing.region}
                </p>
              </div>
              <span className="rounded-md bg-[color:var(--cc-sage)]/20 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--cc-olive)]">
                Synthetic demo
              </span>
            </div>
            <p className="mt-3 text-base leading-relaxed">{listing.summary}</p>
            <p className="mt-2 text-sm text-[color:var(--cc-ink)]/75">
              <span className="font-medium">Accessibility:</span>{" "}
              {listing.accessibilityNotes}
            </p>
            <p className="mt-4">
              <Link
                href={`/coverage-care/enquiries/new?listingId=${encodeURIComponent(listing.id)}`}
                className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--cc-olive)] px-4 text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
              >
                Enquire about this service
              </Link>
            </p>
          </li>
        ))}
      </ul>

      {listings.length === 0 ? (
        <p className="mt-8 text-[color:var(--cc-ink)]/75" role="status">
          No synthetic listings match those filters.
        </p>
      ) : null}
    </div>
  );
}
