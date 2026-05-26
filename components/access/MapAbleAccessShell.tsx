"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AccessFilterPanel } from "@/components/access/AccessFilterPanel";
import { AccessMap } from "@/components/access/AccessMap";
import { AccessPlaceList } from "@/components/access/AccessPlaceList";
import { AccessSearchBar } from "@/components/access/AccessSearchBar";
import { MobileAccessMapShell } from "@/components/access/MobileAccessMapShell";
import { MapAbleWavyText } from "@/components/brand/MapAbleWavyText";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";

export type AccessPlaceView = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
};

export function MapAbleAccessShell({
  initialPlaces,
}: {
  initialPlaces: AccessPlaceView[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [places, setPlaces] = useState(initialPlaces);
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const search = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    const res = await fetch(`/api/access/search?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setPlaces(
      data.results.map(
        (r: {
          place: {
            id: string;
            name: string;
            category: string;
            suburb?: string;
            reviewCount: number;
            latitude?: number;
            longitude?: number;
          };
        }) => ({
          id: r.place.id,
          name: r.place.name,
          category: r.place.category,
          suburb: r.place.suburb,
          reviewCount: r.place.reviewCount,
          latitude: r.place.latitude,
          longitude: r.place.longitude,
        }),
      ),
    );
  }, [query, category]);

  const skipCategorySearchOnMount = useRef(true);
  useEffect(() => {
    if (skipCategorySearchOnMount.current) {
      skipCategorySearchOnMount.current = false;
      return;
    }
    void search();
    // Re-run when category changes; query updates use the search bar submit handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- category filter only
  }, [category]);

  const mapPlaces = places
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude!,
      longitude: p.longitude!,
    }));

  return (
    <MobileAccessMapShell view={view} onViewChange={setView}>
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-[#F6FBFC] via-white to-white">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[hsl(var(--mapable-yellow))]/30 blur-3xl motion-reduce:blur-none"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-5 lg:px-8">
          <header>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
              Accessible places
            </p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.045em]">
              <MapAbleWavyText text="Places with access notes, not guesswork." />
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              Public accessibility map with community reviews and optional
              MapAble Accreditation. Find cafes, venues and everyday places with
              access notes from people who have been there.
            </p>
          </header>

          <AccessSearchBar
            value={query}
            onChange={setQuery}
            onSubmit={search}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-5 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AccessFilterPanel
            category={category}
            onCategoryChange={setCategory}
          />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`min-h-11 rounded-xl px-4 font-black transition focus:outline-none focus:ring-4 focus:ring-ring/40 ${view === "list" ? "bg-primary text-primary-foreground" : "border border-slate-200 bg-white text-foreground hover:bg-accent"}`}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                List view
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-xl px-4 font-black transition focus:outline-none focus:ring-4 focus:ring-ring/40 ${view === "map" ? "bg-primary text-primary-foreground" : "border border-slate-200 bg-white text-foreground hover:bg-accent"}`}
                onClick={() => setView("map")}
                aria-pressed={view === "map"}
              >
                Map view
              </button>
            </div>

            {view === "map" ? (
              <AccessMap
                places={mapPlaces}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : null}

            <AccessPlaceList places={places} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{ACCESS_DISCLAIMER}</p>
      </div>
    </MobileAccessMapShell>
  );
}
