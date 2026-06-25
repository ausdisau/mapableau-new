"use client";

import { useMemo, useState } from "react";

import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { SectionHeader } from "@/components/ui/section-header";

export type VenuePreview = {
  id: string;
  name: string;
  category: string;
  suburb: string;
  lastUpdated: string;
  confidence: "community" | "owner" | "verified";
};

const sampleVenues: VenuePreview[] = [
  {
    id: "1",
    name: "Riverside Community Centre",
    category: "Community",
    suburb: "Parramatta",
    lastUpdated: "2026-06-10",
    confidence: "verified",
  },
  {
    id: "2",
    name: "Harbour View Café",
    category: "Food & drink",
    suburb: "Sydney",
    lastUpdated: "2026-06-08",
    confidence: "community",
  },
  {
    id: "3",
    name: "Northside Medical Hub",
    category: "Health",
    suburb: "Chatswood",
    lastUpdated: "2026-06-01",
    confidence: "owner",
  },
];

const categories = ["All", "Community", "Food & drink", "Health", "Transport"];

export function AccessMapSearchPreview() {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All");
  const [accessFilter, setAccessFilter] = useState("step_free");

  const results = useMemo(() => {
    return sampleVenues.filter((venue) => {
      const matchesCategory = category === "All" || venue.category === category;
      const matchesLocation =
        !location.trim() ||
        venue.suburb.toLowerCase().includes(location.toLowerCase()) ||
        venue.name.toLowerCase().includes(location.toLowerCase());
      return matchesCategory && matchesLocation;
    });
  }, [category, location]);

  return (
    <section aria-labelledby="search-preview-heading" className="rounded-2xl border border-border bg-card p-5">
      <SectionHeader
        as="h2"
        id="search-preview-heading"
        title="Search preview"
        description="List-first results. The live map is available at /access/map."
      />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <AccessibleFormField id="map-location" label="Location">
          <input
            id="map-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Suburb or venue name"
            className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
          />
        </AccessibleFormField>
        <AccessibleFormField id="map-category" label="Category">
          <select
            id="map-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </AccessibleFormField>
        <AccessibleFormField id="map-access" label="Access need filter">
          <select
            id="map-access"
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
          >
            <option value="step_free">Step-free entry</option>
            <option value="accessible_toilet">Accessible toilet</option>
            <option value="quiet">Quiet / low sensory</option>
            <option value="hearing">Hearing support</option>
          </select>
        </AccessibleFormField>
      </div>
      <ul className="mt-6 space-y-3" aria-live="polite">
        {results.map((venue) => (
          <li key={venue.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-bold">{venue.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {venue.category} · {venue.suburb}
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {venue.confidence} confidence
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Last updated {venue.lastUpdated}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
