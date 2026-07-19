"use client";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function AccessibleMapListToggle({
  view,
  onChange,
  resultCount,
  selectedLabel,
}: {
  view: "list" | "map";
  onChange: (view: "list" | "map") => void;
  resultCount: number;
  selectedLabel?: string;
}) {
  return (
    <div className="space-y-2" data-testid="accessible-map-list-toggle">
      <div
        role="group"
        aria-label="Results view"
        className="inline-flex rounded-xl border-2 border-[#0C1833] p-1"
      >
        <button
          type="button"
          className={`min-h-11 min-w-11 rounded-lg px-4 text-sm font-black ${
            view === "list" ? "bg-[#005B7F] text-white" : "bg-white text-[#0C1833]"
          } ${mapableCareFocusRing}`}
          aria-pressed={view === "list"}
          onClick={() => onChange("list")}
        >
          List
        </button>
        <button
          type="button"
          className={`min-h-11 min-w-11 rounded-lg px-4 text-sm font-black ${
            view === "map" ? "bg-[#005B7F] text-white" : "bg-white text-[#0C1833]"
          } ${mapableCareFocusRing}`}
          aria-pressed={view === "map"}
          onClick={() => onChange("map")}
        >
          Map
        </button>
      </div>
      <p className="text-sm text-slate-600" aria-live="polite" aria-atomic="true">
        {resultCount} {resultCount === 1 ? "place" : "places"}
        {selectedLabel ? ` · Selected: ${selectedLabel}` : ""}
        . List and map show the same places and access facts.
      </p>
    </div>
  );
}
