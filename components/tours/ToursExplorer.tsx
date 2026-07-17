"use client";

import React, { useMemo, useState } from "react";

import { TourCard } from "@/components/tours/TourCard";
import {
  TourFilterBar,
  type TourFiltersState,
} from "@/components/tours/TourFilterBar";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  filterTours,
  getTourAccessProfiles,
  getTourCategories,
  getTourCities,
  type Tour,
} from "@/lib/resources/tours-data";

type ToursExplorerProps = {
  tours: Tour[];
};

export function ToursExplorer({ tours }: ToursExplorerProps) {
  const [filters, setFilters] = useState<TourFiltersState>({
    query: "",
    city: null,
    category: null,
    accessProfile: null,
  });

  const cities = useMemo(() => getTourCities(), []);
  const categories = useMemo(() => getTourCategories(), []);
  const accessProfiles = useMemo(() => getTourAccessProfiles(), []);

  const filtered = useMemo(
    () =>
      filterTours({
        query: filters.query,
        city: filters.city,
        category: filters.category,
        accessProfile: filters.accessProfile,
      }),
    [filters],
  );

  // Prefer the shared catalogue when unfiltered so cards stay in source order.
  const visibleTours =
    filters.query || filters.city || filters.category || filters.accessProfile
      ? filtered
      : tours;

  return (
    <div className="space-y-8">
      <div className={mapablePublicCardClass}>
        <h2 className="text-lg font-black text-[#0C1833] sm:text-xl">
          Search and filters
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Filter by city, category or access profile. Selected filters use a
          pressed button state so keyboard and screen-reader users can tell what
          is active.
        </p>
        <div className="mt-6">
          <TourFilterBar
            filters={filters}
            cities={cities}
            categories={categories}
            accessProfiles={accessProfiles}
            onChange={setFilters}
            resultCount={visibleTours.length}
          />
        </div>
      </div>

      <section aria-labelledby="tour-results-heading">
        <h2
          id="tour-results-heading"
          className="text-lg font-black text-[#0C1833] sm:text-xl"
        >
          Tour results
        </h2>
        {visibleTours.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-slate-700">
            No tours match those filters yet. Clear a filter or suggest a tour
            using the contact option below.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
