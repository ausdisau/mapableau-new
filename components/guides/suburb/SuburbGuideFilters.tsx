"use client";

import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  formatSuburbAccessTheme,
  formatSuburbGuideStatus,
} from "@/lib/resources/suburb-access-guides-data";
import type {
  SuburbAccessTheme,
  SuburbGuideStatus,
} from "@/types/suburb-access-guide";

export type SuburbGuideFiltersState = {
  query: string;
  stateSlug: string | null;
  status: SuburbGuideStatus | null;
  theme: SuburbAccessTheme | null;
};

type SuburbGuideFiltersProps = {
  filters: SuburbGuideFiltersState;
  states: Array<{ slug: string; label: string }>;
  statuses: SuburbGuideStatus[];
  themes: SuburbAccessTheme[];
  resultCount: number;
  onChange: (next: SuburbGuideFiltersState) => void;
};

const chipBase =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-bold transition motion-reduce:transform-none";

function Chip({
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

export function SuburbGuideFilters({
  filters,
  states,
  statuses,
  themes,
  resultCount,
  onChange,
}: SuburbGuideFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="suburb-guide-search"
          className="text-sm font-black text-[#0C1833]"
        >
          Search suburbs
        </label>
        <input
          id="suburb-guide-search"
          type="search"
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          placeholder="Search by suburb, SAL code or theme"
          className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0C1833] shadow-sm ${mapableCareFocusRing}`}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">State</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            label="All states"
            pressed={filters.stateSlug === null}
            onClick={() => onChange({ ...filters, stateSlug: null })}
          />
          {states.map((state) => (
            <Chip
              key={state.slug}
              label={state.label}
              pressed={filters.stateSlug === state.slug}
              onClick={() =>
                onChange({
                  ...filters,
                  stateSlug:
                    filters.stateSlug === state.slug ? null : state.slug,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Status</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            label="All statuses"
            pressed={filters.status === null}
            onClick={() => onChange({ ...filters, status: null })}
          />
          {statuses.map((status) => (
            <Chip
              key={status}
              label={formatSuburbGuideStatus(status)}
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

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Theme</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            label="All themes"
            pressed={filters.theme === null}
            onClick={() => onChange({ ...filters, theme: null })}
          />
          {themes.map((theme) => (
            <Chip
              key={theme}
              label={formatSuburbAccessTheme(theme)}
              pressed={filters.theme === theme}
              onClick={() =>
                onChange({
                  ...filters,
                  theme: filters.theme === theme ? null : theme,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <p className="text-sm leading-7 text-slate-600" aria-live="polite">
        Showing {resultCount} suburb guide{resultCount === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

export function SuburbGuideSearch(
  props: Omit<SuburbGuideFiltersProps, "themes" | "statuses"> & {
    statuses?: SuburbGuideStatus[];
    themes?: SuburbAccessTheme[];
  },
) {
  return (
    <SuburbGuideFilters
      {...props}
      statuses={props.statuses ?? []}
      themes={props.themes ?? []}
    />
  );
}
