"use client";

import {
  ACCESS_CAPITAL_REGIONS,
  type AccessCapitalRegionSlug,
} from "@/lib/access/regions/gccsa";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type AccessRegionSelection = "all" | AccessCapitalRegionSlug;

export function GccsaRegionSelector({
  value,
  onChange,
  boundaryState,
}: {
  value: AccessRegionSelection;
  onChange: (value: AccessRegionSelection) => void;
  boundaryState: "loading" | "ready" | "partial" | "unavailable";
}) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4 sm:p-5"
      aria-labelledby="capital-region-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
            National Access
          </p>
          <h2
            id="capital-region-heading"
            className="mt-1 text-xl font-black tracking-[-0.03em] text-[#0C1833]"
          >
            Choose a capital-city region
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Regions use ABS 2026 Greater Capital City Statistical Areas. They are
            statistical boundaries for discovery, not service or eligibility boundaries.
          </p>
        </div>
        <span
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
          role="status"
        >
          {boundaryState === "ready"
            ? "ABS boundary loaded"
            : boundaryState === "partial"
              ? "ABS boundary partially loaded"
              : boundaryState === "loading"
                ? "Loading ABS boundary"
                : "Boundary unavailable"}
        </span>
      </div>

      <div
        className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5"
        role="group"
        aria-label="Capital-city region"
      >
        <button
          type="button"
          aria-pressed={value === "all"}
          onClick={() => onChange("all")}
          className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-bold ${mapableInteractiveFocusRing} ${
            value === "all"
              ? "border-[#005B7F] bg-[#005B7F] text-white"
              : "border-slate-300 bg-white text-[#0C1833]"
          }`}
        >
          All eight capitals
        </button>
        {ACCESS_CAPITAL_REGIONS.map((region) => (
          <button
            key={region.slug}
            type="button"
            aria-pressed={value === region.slug}
            onClick={() => onChange(region.slug)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-left ${mapableInteractiveFocusRing} ${
              value === region.slug
                ? "border-[#005B7F] bg-[#005B7F] text-white"
                : "border-slate-300 bg-white text-[#0C1833]"
            }`}
          >
            <span className="block text-sm font-black">{region.displayName}</span>
            <span className="block text-xs opacity-80">
              {region.gccsaCode} · {region.stateOrTerritory}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
