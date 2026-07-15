"use client";

import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  formatBusinessAudience,
  formatBusinessBarrier,
  formatBusinessFormat,
} from "@/lib/resources/business-resources-data";
import type {
  BusinessBarrierType,
  BusinessResourceAudience,
  BusinessResourceFormat,
} from "@/types/business-resource";

export type BusinessResourceFiltersState = {
  query: string;
  audience: BusinessResourceAudience | null;
  format: BusinessResourceFormat | null;
  barrier: BusinessBarrierType | null;
};

type BusinessResourceFiltersProps = {
  filters: BusinessResourceFiltersState;
  audiences: BusinessResourceAudience[];
  formats: BusinessResourceFormat[];
  barriers: BusinessBarrierType[];
  resultCount: number;
  onChange: (next: BusinessResourceFiltersState) => void;
};

const chipBase =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-bold transition";

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

export function BusinessResourceFilters({
  filters,
  audiences,
  formats,
  barriers,
  resultCount,
  onChange,
}: BusinessResourceFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="business-resource-search"
          className="text-sm font-black text-[#0C1833]"
        >
          Search business resources
        </label>
        <input
          id="business-resource-search"
          type="search"
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          placeholder="Search by title, audience or barrier"
          className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#0C1833] shadow-sm ${mapableCareFocusRing}`}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Audience</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            label="All audiences"
            pressed={filters.audience === null}
            onClick={() => onChange({ ...filters, audience: null })}
          />
          {audiences.map((audience) => (
            <Chip
              key={audience}
              label={formatBusinessAudience(audience)}
              pressed={filters.audience === audience}
              onClick={() =>
                onChange({
                  ...filters,
                  audience: filters.audience === audience ? null : audience,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Format</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            label="All formats"
            pressed={filters.format === null}
            onClick={() => onChange({ ...filters, format: null })}
          />
          {formats.map((format) => (
            <Chip
              key={format}
              label={formatBusinessFormat(format)}
              pressed={filters.format === format}
              onClick={() =>
                onChange({
                  ...filters,
                  format: filters.format === format ? null : format,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-[#0C1833]">Barrier</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            label="All barriers"
            pressed={filters.barrier === null}
            onClick={() => onChange({ ...filters, barrier: null })}
          />
          {barriers.map((barrier) => (
            <Chip
              key={barrier}
              label={formatBusinessBarrier(barrier)}
              pressed={filters.barrier === barrier}
              onClick={() =>
                onChange({
                  ...filters,
                  barrier: filters.barrier === barrier ? null : barrier,
                })
              }
            />
          ))}
        </div>
      </fieldset>

      <p className="text-sm leading-7 text-slate-600" aria-live="polite">
        Showing {resultCount} resource{resultCount === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
