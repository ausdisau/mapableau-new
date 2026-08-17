"use client";

import type { TwinPlaceType, TwinAssessmentTier } from "@/lib/digital-twin/types";

export type DigitalTwinFilters = {
  placeType?: TwinPlaceType;
  minTier?: TwinAssessmentTier;
  hasAccessibleToilet?: boolean;
  stepFreeEntrance?: boolean;
  quietSpace?: boolean;
  transportConnection?: boolean;
};

type Props = {
  filters: DigitalTwinFilters;
  onChange: (filters: DigitalTwinFilters) => void;
};

export function DigitalTwinFilterPanel({ filters, onChange }: Props) {
  function toggle(key: keyof DigitalTwinFilters) {
    if (key === "placeType" || key === "minTier") return;
    onChange({ ...filters, [key]: !filters[key] });
  }

  return (
    <section aria-labelledby="dt-filters-heading" className="rounded-xl border border-border p-4">
      <h2 id="dt-filters-heading" className="text-base font-semibold">
        Filter demo places
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="filter-place-type" className="block text-sm font-medium">
            Place type
          </label>
          <select
            id="filter-place-type"
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={filters.placeType ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                placeType: (e.target.value || undefined) as TwinPlaceType | undefined,
              })
            }
          >
            <option value="">All types</option>
            <option value="clinic">Clinic</option>
            <option value="venue">Venue</option>
            <option value="transport_hub">Transport hub</option>
            <option value="workplace">Workplace</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-min-tier" className="block text-sm font-medium">
            Minimum tier
          </label>
          <select
            id="filter-min-tier"
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={filters.minTier ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                minTier: (e.target.value || undefined) as TwinAssessmentTier | undefined,
              })
            }
          >
            <option value="">Any tier</option>
            <option value="bronze">Bronze or above</option>
            <option value="silver">Silver or above</option>
            <option value="gold">Gold</option>
          </select>
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Access features</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {(
            [
              ["hasAccessibleToilet", "Has accessible toilet info"],
              ["stepFreeEntrance", "Step-free entrance"],
              ["quietSpace", "Quiet space"],
              ["transportConnection", "Transport connection"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(filters[key])}
                onChange={() => toggle(key)}
                className="size-4 rounded border-border"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
