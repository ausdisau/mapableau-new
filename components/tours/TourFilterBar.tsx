"use client";

import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  formatAccessProfile,
  formatTourCategory,
  type TourAccessProfile,
  type TourCategory,
} from "@/lib/resources/tours-data";

export type TourFiltersState = {
  query: string;
  city: string | null;
  category: TourCategory | null;
  accessProfile: TourAccessProfile | null;
};

type TourFilterBarProps = {
  filters: TourFiltersState;
  cities: string[];
  categories: TourCategory[];
  accessProfiles: TourAccessProfile[];
  onChange: (next: TourFiltersState) => void;
  resultCount: number;
};

const chipBase =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-bold transition motion-reduce:transform-none";

function FilterChip({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`${chipBase} ${mapableCareFocusRing} ${
        pressed
          ? "border-[#005B7F] bg-[#005B7F] text-white"
          : "border-slate-200 bg-white text-[#005B7F] hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

export function TourFilterBar({
  filters,
  cities,
  categories,
  accessProfiles,
  onChange,
  resultCount,
}: TourFilterBarProps) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="tour-search"
          className="text-sm font-black text-[#0C1833]"
        >
          Search tours
        </label>
        <input
          id="tour-search"
          type="search"
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          placeholder="Search by city, venue or need"
          className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0C1833] shadow-sm ${mapableCareFocusRing}`}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">City</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="All cities"
            pressed={filters.city === null}
            onClick={() => onChange({ ...filters, city: null })}
          />
          {cities.map((city) => (
            <FilterChip
              key={city}
              label={city}
              pressed={filters.city === city}
              onClick={() =>
                onChange({
                  ...filters,
                  city: filters.city === city ? null : city,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Category</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="All categories"
            pressed={filters.category === null}
            onClick={() => onChange({ ...filters, category: null })}
          />
          {categories.map((category) => (
            <FilterChip
              key={category}
              label={formatTourCategory(category)}
              pressed={filters.category === category}
              onClick={() =>
                onChange({
                  ...filters,
                  category: filters.category === category ? null : category,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">
          Access profile
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="All profiles"
            pressed={filters.accessProfile === null}
            onClick={() => onChange({ ...filters, accessProfile: null })}
          />
          {accessProfiles.map((profile) => (
            <FilterChip
              key={profile}
              label={formatAccessProfile(profile)}
              pressed={filters.accessProfile === profile}
              onClick={() =>
                onChange({
                  ...filters,
                  accessProfile:
                    filters.accessProfile === profile ? null : profile,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <p className="text-sm leading-7 text-slate-600" aria-live="polite">
        Showing {resultCount} tour{resultCount === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
