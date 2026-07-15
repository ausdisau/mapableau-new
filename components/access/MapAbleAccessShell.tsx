"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AccessChatPanel } from "@/components/access-chat/AccessChatPanel";
import { AccessFilterPanel } from "@/components/access/AccessFilterPanel";
import { AccessMap } from "@/components/access/AccessMap";
import { AccessPlaceList } from "@/components/access/AccessPlaceList";
import { AccessSearchBar } from "@/components/access/AccessSearchBar";
import { MobileAccessMapShell } from "@/components/access/MobileAccessMapShell";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import type { AccessSearchResult } from "@/types/access-chat";

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
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [places, setPlaces] = useState(initialPlaces);
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const placeId = searchParams.get("placeId");
    if (placeId) {
      setSelectedId(placeId);
      setView("map");
    }
    if (searchParams.get("chat") === "1") {
      setChatOpen(true);
    }
  }, [searchParams]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- category filter only
  }, [category]);

  const onChatResults = useCallback((results: AccessSearchResult[]) => {
    if (!results.length) return;
    setPlaces(
      results.map((r) => ({
        id: r.placeId,
        name: r.name,
        category: r.category,
        suburb: r.address,
        reviewCount: r.evidence.verifiedByCommunityCount,
        latitude: r.latitude,
        longitude: r.longitude,
      })),
    );
    setSelectedId(results[0]?.placeId);
    setView("map");
  }, []);

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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header>
          <h1 className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833]">
            MapAble Access
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Public accessibility map with community reviews and optional MapAble
            Accreditation. This venue has user-reported accessibility information
            where shown.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`min-h-11 rounded-xl px-4 font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F] ${chatOpen ? "bg-[#005B7F] text-white" : "border-2 border-slate-200 bg-white text-[#0C1833]"}`}
              onClick={() => setChatOpen((o) => !o)}
              aria-expanded={chatOpen}
              aria-controls="access-chat-panel"
            >
              {chatOpen ? "Hide access chat" : "Ask Access chat"}
            </button>
            <Link
              href="/access/chat"
              className="inline-flex min-h-11 items-center rounded-xl border-2 border-slate-200 bg-white px-4 font-black text-[#0C1833] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
            >
              Open full chat page
            </Link>
          </div>
        </header>

        {chatOpen ? (
          <div id="access-chat-panel" className="rounded-2xl border-2 border-slate-200 bg-white p-4">
            <AccessChatPanel
              compact
              onOpenMarker={(id) => {
                setSelectedId(id);
                setView("map");
              }}
              onResults={onChatResults}
            />
          </div>
        ) : null}

        <AccessSearchBar value={query} onChange={setQuery} onSubmit={search} />

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AccessFilterPanel category={category} onCategoryChange={setCategory} />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`min-h-11 rounded-xl px-4 font-black ${view === "list" ? "bg-[#005B7F] text-white" : "border border-slate-200 bg-white text-[#0C1833]"}`}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                List view
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-xl px-4 font-black ${view === "map" ? "bg-[#005B7F] text-white" : "border border-slate-200 bg-white text-[#0C1833]"}`}
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
