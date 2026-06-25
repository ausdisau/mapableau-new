"use client";

import { useMemo, useState } from "react";

import { VerticalCard } from "@/components/marketing/VerticalCard";
import type { MapAbleVertical } from "@/lib/mapable/verticals";
import {
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

export type VerticalFilter =
  | "all"
  | "existing"
  | "proposed"
  | "pilot"
  | "high-priority"
  | "low-complexity";

const filterOptions: { id: VerticalFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "existing", label: "Existing" },
  { id: "proposed", label: "Proposed" },
  { id: "pilot", label: "Pilot" },
  { id: "high-priority", label: "High priority" },
  { id: "low-complexity", label: "Low complexity" },
];

export function filterVerticals(
  verticals: MapAbleVertical[],
  filter: VerticalFilter,
): MapAbleVertical[] {
  switch (filter) {
    case "all":
      return verticals;
    case "existing":
      return verticals.filter((v) => v.status === "existing");
    case "proposed":
      return verticals.filter((v) => v.status === "proposed");
    case "pilot":
      return verticals.filter((v) => v.status === "pilot");
    case "high-priority":
      return verticals.filter((v) => v.priority <= 2);
    case "low-complexity":
      return verticals.filter((v) => v.implementationComplexity === "low");
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export type VerticalGridProps = {
  verticals: MapAbleVertical[];
  heading: string;
  intro?: string;
  showFilters?: boolean;
};

export function VerticalGrid({
  verticals,
  heading,
  intro,
  showFilters = false,
}: VerticalGridProps) {
  const [activeFilter, setActiveFilter] = useState<VerticalFilter>("all");

  const filtered = useMemo(
    () => filterVerticals(verticals, activeFilter),
    [verticals, activeFilter],
  );

  return (
    <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
      <div className="mb-8 max-w-3xl">
        <p className={mapablePublicSectionTitleClass}>MapAble verticals</p>
        <h2 className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl">
          {heading}
        </h2>
        {intro ? (
          <p className="mt-4 text-base leading-7 text-slate-600">{intro}</p>
        ) : null}
      </div>

      {showFilters ? (
        <div
          className="mb-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter verticals"
        >
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(option.id)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 ${
                  isActive
                    ? "border-[#005B7F] bg-[#005B7F] text-white"
                    : "border-slate-200 bg-white text-[#0C1833] hover:border-[#005B7F]/30"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600" role="status">
          No verticals match this filter.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {filtered.map((vertical) => (
            <li key={vertical.id} className="list-none">
              <VerticalCard vertical={vertical} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
