"use client";

import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  formatAccessGuideStatusKey,
  type AccessGuideStatusKey,
} from "@/lib/resources/access-guides-data";

export type GuideFiltersState = {
  query: string;
  state: string | null;
  tier: string | null;
  status: AccessGuideStatusKey | null;
};

type GuideFiltersProps = {
  filters: GuideFiltersState;
  states: string[];
  tiers: string[];
  statuses: AccessGuideStatusKey[];
  resultCount: number;
  onChange: (next: GuideFiltersState) => void;
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

export function GuideFilters({
  filters,
  states,
  tiers,
  statuses,
  resultCount,
  onChange,
}: GuideFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="guide-search"
          className="text-sm font-black text-[#0C1833]"
        >
          Search guides
        </label>
        <input
          id="guide-search"
          type="search"
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          placeholder="Search by city, state or access theme"
          className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0C1833] shadow-sm ${mapableCareFocusRing}`}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">State</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="All states"
            pressed={filters.state === null}
            onClick={() => onChange({ ...filters, state: null })}
          />
          {states.map((state) => (
            <FilterChip
              key={state}
              label={state}
              pressed={filters.state === state}
              onClick={() =>
                onChange({
                  ...filters,
                  state: filters.state === state ? null : state,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Tier</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="All tiers"
            pressed={filters.tier === null}
            onClick={() => onChange({ ...filters, tier: null })}
          />
          {tiers.map((tier) => (
            <FilterChip
              key={tier}
              label={tier}
              pressed={filters.tier === tier}
              onClick={() =>
                onChange({
                  ...filters,
                  tier: filters.tier === tier ? null : tier,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Status</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="All statuses"
            pressed={filters.status === null}
            onClick={() => onChange({ ...filters, status: null })}
          />
          {statuses.map((status) => (
            <FilterChip
              key={status}
              label={formatAccessGuideStatusKey(status)}
              pressed={filters.status === status}
              onClick={() =>
                onChange({
                  ...filters,
                  status: filters.status === status ? null : status,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <p className="text-sm leading-7 text-slate-600" aria-live="polite">
        Showing {resultCount} guide{resultCount === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
