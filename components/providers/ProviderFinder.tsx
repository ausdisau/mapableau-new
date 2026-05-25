"use client";

import { List, Map as MapIcon, MapPin, Maximize2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ProviderFilterChips } from "@/components/providers/ProviderFilterChips";
import { ProviderFinderMap } from "@/components/providers/ProviderFinderMap";
import { ProviderSearchFilters } from "@/components/providers/ProviderSearchFilters";
import { ProviderSearchResults } from "@/components/providers/ProviderSearchResults";
import { MobileProviderSearchSheet } from "@/components/providers/MobileProviderSearchSheet";
import type { ProviderResult } from "@/components/providers/ProviderSearchResults";

const QUICK_CHIPS = [
  { id: "ndis", label: "NDIS" },
  { id: "transport", label: "Transport" },
  { id: "nearby", label: "Nearby" },
];

export function ProviderFinder({
  initialResults = [],
}: {
  initialResults?: ProviderResult[];
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<string | null>(null);
  const [supportType, setSupportType] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const results = useMemo(() => {
    let list = initialResults;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.suburb?.toLowerCase().includes(q)
      );
    }
    if (position && list.some((p) => p.distanceKm != null)) {
      list = [...list].sort(
        (a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
      );
    }
    return list;
  }, [initialResults, query, position]);


  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  return (
    <div className="flex w-full max-w-full flex-col gap-4 overflow-x-hidden">
      <label htmlFor="provider-search" className="sr-only">
        Search providers
      </label>
      <input
        id="provider-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search providers"
        className="min-h-11 w-full rounded-xl border border-input bg-background px-4 text-base"
      />

      <ProviderFilterChips
        chips={QUICK_CHIPS}
        activeId={chip}
        onSelect={setChip}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={view === "list"}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium"
          onClick={() => setView("list")}
        >
          <List className="h-4 w-4" aria-hidden />
          List
        </button>
        <button
          type="button"
          aria-pressed={view === "map"}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium"
          onClick={() => setView("map")}
        >
          <MapIcon className="h-4 w-4" aria-hidden />
          Map
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium"
          onClick={requestLocation}
        >
          <MapPin className="h-4 w-4" aria-hidden />
          My location
        </button>
      </div>

      {view === "map" ? (
        <>
          <ProviderFinderMap
            providers={[]}
            userPosition={position}
            fullscreen={fullscreenMap}
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setFullscreenMap((f) => !f)}
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
            {fullscreenMap ? "Exit fullscreen map" : "Fullscreen map"}
          </button>
        </>
      ) : (
        <ProviderSearchResults results={results} />
      )}

      <p className="text-sm text-muted-foreground">
        The list is always available for screen reader and keyboard users. Map
        pins supplement the list; they do not replace it.
      </p>

      <button
        type="button"
        className="sticky bottom-24 z-10 min-h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground md:bottom-4"
        onClick={() => setFilterOpen(true)}
      >
        Refine search
      </button>

      <MobileProviderSearchSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
      >
        <ProviderSearchFilters
          supportType={supportType}
          onSupportTypeChange={setSupportType}
        />
      </MobileProviderSearchSheet>
    </div>
  );
}
