"use client";

import React, { useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { PlaceResultCard } from "@/components/access-intelligence/evidence-list";
import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PlaceHit = {
  place: {
    id: string;
    name: string;
    address: string;
    category: string;
  };
  matchReason: string;
};

export function ExplorePlacesClient() {
  const [q, setQ] = useState("MapAble");
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/access-intelligence/places/search?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.places ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessIntelligenceShell
      title="Explore places"
      description="Search demo venues without using chat. Results include addresses and map-free detail links."
    >
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label className="sr-only" htmlFor="place-search">
          Search places
        </label>
        <input
          id="place-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`min-h-11 flex-1 rounded-xl border border-slate-300 px-4 ${mapableCareFocusRing}`}
          placeholder="Search by name or category"
        />
        <Button
          type="submit"
          variant="default"
          size="default"
          disabled={loading || !q.trim()}
        >
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>
      {error ? (
        <p className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {results.map((r) => (
          <li key={r.place.id}>
            <PlaceResultCard
              name={r.place.name}
              address={r.place.address}
              reason={r.matchReason}
              href={`/access-intelligence/places/${r.place.id}`}
            />
          </li>
        ))}
      </ul>
      {!loading && results.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          No results yet. Try “Harbour”, “Library”, or “MapAble”.
        </p>
      ) : null}
    </AccessIntelligenceShell>
  );
}
