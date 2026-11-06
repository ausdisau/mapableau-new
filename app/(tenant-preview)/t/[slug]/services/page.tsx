import Link from "next/link";

import { listCoverageCareServices } from "@/lib/coverage-care/listing-service";
import { LISTING_PUBLICATION_STATUS } from "@/lib/tenancy/coverage-care-brand";

export default async function TenantServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ discipline?: string; region?: string }>;
}) {
  const { slug } = await params;
  const resolved = (await searchParams) ?? {};
  const listings = listCoverageCareServices({
    discipline: resolved.discipline,
    regionQuery: resolved.region,
  });
  const base = `/t/${slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
          Allied-health service directory
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[color:var(--cc-ink)]/80">
          Proposed catalogue for the Coverage Care pilot. Every entry displays{" "}
          <strong>{LISTING_PUBLICATION_STATUS}</strong> until an authorised human
          publishes evidence. No treatment outcomes, NDIA eligibility, pricing,
          slots or qualifications are claimed.
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
                {listing.publicationStatus}
              </span>
            </div>
            <p className="mt-3 text-base leading-relaxed">{listing.summary}</p>
            <p className="mt-2 text-sm text-[color:var(--cc-ink)]/75">
              <span className="font-medium">Accessibility:</span>{" "}
              {listing.accessibilityNotes}
            </p>
            <p className="mt-4">
              <Link
                href={`${base}/enquire?listingId=${encodeURIComponent(listing.id)}`}
                className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--cc-olive)] px-4 text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
              >
                Enquire about this service
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
