"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import type { AutocompleteSuggestion } from "@/types/search";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function navigateToFinder() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    const qs = params.toString();
    router.push(qs ? `/provider-finder?${qs}` : "/provider-finder");
  }

  function applySuggestion(
    suggestion: AutocompleteSuggestion,
    target: "query" | "location",
  ) {
    if (target === "location" || suggestion.type === "location") {
      setLocation(suggestion.value);
      return;
    }
    setQuery(suggestion.value);
  }

  return (
    <section
      aria-labelledby="home-search-heading"
      className="border-b border-border/60 bg-gradient-to-b from-primary/[0.06] via-background to-background py-12 sm:py-16"
    >
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2
          id="home-search-heading"
          className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Find disability support near you
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Search services, providers, locations and access needs with fewer
          keystrokes. Suggestions update as you type — press Search when ready.
        </p>

        <form
          className="mx-auto mt-8 max-w-3xl text-left"
          onSubmit={(e) => {
            e.preventDefault();
            navigateToFinder();
          }}
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-lg sm:p-4">
            <AccessibleAutocomplete
              id="home-search-query"
              label="What are you looking for?"
              placeholder="e.g. transport, physiotherapy, Auslan"
              context="homepage"
              field="all"
              value={query}
              onChange={setQuery}
              onSelect={(s) => applySuggestion(s, "query")}
              icon={<Search className="h-4 w-4" aria-hidden />}
            />
            <AccessibleAutocomplete
              id="home-search-location"
              label="Location (optional)"
              placeholder="Suburb or postcode"
              context="homepage"
              field="location"
              value={location}
              onChange={setLocation}
              onSelect={(s) => applySuggestion(s, "location")}
              helperText="Uses MapAble’s local location list — not a public geocoding API."
            />
            <Button type="submit" variant="default" size="lg" className="w-full sm:w-auto">
              Search providers
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
