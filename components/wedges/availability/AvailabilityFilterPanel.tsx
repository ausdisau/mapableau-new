"use client";

import type { AvailabilityFilters, FundingType } from "@/types/wedges";
import { FUNDING_TYPES } from "@/types/wedges";
import { formInputClass } from "@/components/forms/AccessibleFormField";

type AvailabilityFilterPanelProps = {
  filters: AvailabilityFilters;
  onChange: (filters: AvailabilityFilters) => void;
  idPrefix?: string;
};

export function AvailabilityFilterPanel({
  filters,
  onChange,
  idPrefix = "avail-filter",
}: AvailabilityFilterPanelProps) {
  const toggle = (key: keyof AvailabilityFilters, value?: boolean) => {
    onChange({ ...filters, [key]: value ?? !filters[key] });
  };

  return (
    <section aria-labelledby={`${idPrefix}-heading`} className="space-y-4">
      <h3 id={`${idPrefix}-heading`} className="font-heading text-sm font-semibold">
        Availability filters
      </h3>

      <fieldset className="space-y-2">
        <legend className="sr-only">Quick availability filters</legend>
        {(
          [
            ["availableThisWeek", "Available this week"],
            ["noWaitlist", "No waitlist"],
            ["shortWaitlist", "Short waitlist only"],
            ["mobileService", "Mobile service"],
            ["telehealth", "Telehealth"],
            ["weekend", "Weekend available"],
            ["urgentCapacity", "Urgent start"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(filters[key])}
              onChange={() => toggle(key)}
              className="h-4 w-4 rounded border-input"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={`${idPrefix}-funding`} className="block text-sm font-medium">
          Funding type
        </label>
        <select
          id={`${idPrefix}-funding`}
          value={filters.fundingType ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              fundingType: (e.target.value || undefined) as FundingType | undefined,
            })
          }
          className={formInputClass}
        >
          <option value="">Any funding type</option>
          {FUNDING_TYPES.map((f) => (
            <option key={f} value={f}>
              {f.replace(/-/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-suburb`} className="block text-sm font-medium">
            Suburb
          </label>
          <input
            id={`${idPrefix}-suburb`}
            type="text"
            value={filters.suburb ?? ""}
            onChange={(e) => onChange({ ...filters, suburb: e.target.value || undefined })}
            className={formInputClass}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-postcode`} className="block text-sm font-medium">
            Postcode
          </label>
          <input
            id={`${idPrefix}-postcode`}
            type="text"
            inputMode="numeric"
            value={filters.postcode ?? ""}
            onChange={(e) => onChange({ ...filters, postcode: e.target.value || undefined })}
            className={formInputClass}
            autoComplete="postal-code"
          />
        </div>
      </div>
    </section>
  );
}
