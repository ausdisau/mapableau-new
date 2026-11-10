"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ACCESSIMART_DRAFT_CATEGORIES,
  type AccessiMartReviewListing,
} from "@/lib/marketplace/accessimart-review-adapter";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

const CONDITIONS = [
  { value: "all", label: "All conditions" },
  { value: "new", label: "New" },
  { value: "refurbished", label: "Refurbished" },
  { value: "repair_service", label: "Repair service" },
  { value: "spare_part", label: "Spare part" },
] as const;

function conditionLabel(condition: AccessiMartReviewListing["condition"]): string {
  switch (condition) {
    case "new":
      return "New (example)";
    case "refurbished":
      return "Refurbished (example)";
    case "repair_service":
      return "Repair service (example)";
    case "spare_part":
      return "Spare part (example)";
    case "unknown":
      return "Condition unknown";
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

export function AccessiMartReviewCatalogue({
  listings,
}: {
  listings: readonly AccessiMartReviewListing[];
}) {
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");
  const [condition, setCondition] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("en-AU");
    return listings.filter((listing) => {
      if (categorySlug !== "all" && listing.categorySlug !== categorySlug) {
        return false;
      }
      if (condition !== "all" && listing.condition !== condition) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        listing.name,
        listing.description ?? "",
        listing.sourceClaims.accessNeed ?? "",
        listing.supplier?.tradingName ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("en-AU");
      return haystack.includes(q);
    });
  }, [listings, search, categorySlug, condition]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="accessimart-search" className="block text-sm font-semibold">
            Search products
          </label>
          <input
            id="accessimart-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-1 w-full min-h-11 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-amber-300"
            placeholder="Name, access need, or supplier"
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className={mapablePublicSecondaryButtonClass}
          aria-expanded={filtersOpen}
          aria-controls="accessimart-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {filtersOpen ? "Hide filters" : "Show filters"}
        </button>
      </div>

      {filtersOpen ? (
        <div
          id="accessimart-filters"
          className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="accessimart-category" className="block text-sm font-semibold">
              Category
            </label>
            <select
              id="accessimart-category"
              className="mt-1 w-full min-h-11 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-amber-300"
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
            >
              <option value="all">All categories</option>
              {ACCESSIMART_DRAFT_CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="accessimart-condition" className="block text-sm font-semibold">
              Condition
            </label>
            <select
              id="accessimart-condition"
              className="mt-1 w-full min-h-11 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-amber-300"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
            >
              {CONDITIONS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <p className="text-sm text-slate-700" aria-live="polite">
        Showing {filtered.length} review-only listing
        {filtered.length === 1 ? "" : "s"}. Checkout, quotes and seller contact are
        disabled.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {filtered.map((listing) => (
          <li key={listing.sourceId}>
            <article className={mapablePublicCardClass}>
              <h2 className="text-lg font-black">{listing.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {listing.description}
              </p>
              <dl className="mt-3 grid gap-1 text-xs text-slate-600">
                <div>
                  <dt className="inline font-semibold">Source ID: </dt>
                  <dd className="inline">{listing.sourceId}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Condition: </dt>
                  <dd className="inline">{conditionLabel(listing.condition)}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Access need (seller-stated): </dt>
                  <dd className="inline">
                    {listing.sourceClaims.accessNeed ?? "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Evidence: </dt>
                  <dd className="inline">{listing.evidenceStatus}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Last verified date: </dt>
                  <dd className="inline">
                    {listing.lastVerifiedAt ?? "Unknown"} (unverified)
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Supplier identity: </dt>
                  <dd className="inline">Not independently verified</dd>
                </div>
              </dl>
              {listing.clinicalReviewRecommended ? (
                <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  Specialist or clinical review is recommended before any real-world
                  use. This storefront does not provide that review.
                </p>
              ) : null}
              <div className="mt-4">
                <Link
                  href={`/marketplace/accessimart-review/${listing.slug}`}
                  className={mapablePublicPrimaryButtonClass}
                  aria-label={`View review details for ${listing.name}`}
                >
                  View details
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
