"use client";

import { MapPin, Search } from "lucide-react";

import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";
import { HERO_SUGGESTED_SEARCHES } from "@/lib/provider-finder/filters";

type ProviderFinderHeroProps = {
  query: string;
  location: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
  onSuggestionClick: (suggestion: string) => void;
  compact?: boolean;
};

export function ProviderFinderHero({
  query,
  location,
  onQueryChange,
  onLocationChange,
  onSearch,
  onSuggestionClick,
  compact = false,
}: ProviderFinderHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-background via-background to-primary/[0.04]",
        compact ? "py-8" : "py-14 sm:py-20",
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
        aria-hidden
      />
      <div className="container relative mx-auto max-w-5xl px-4">
        <Badge variant="outline" className={cn("mb-4", mapableEyebrowBadgeClass)}>
          Provider Finder
        </Badge>
        <h1
          className={cn(
            "font-heading font-bold tracking-tight text-foreground",
            compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl lg:text-5xl",
          )}
        >
          Find support that fits your life.
        </h1>
        <p
          className={cn(
            "mt-3 max-w-2xl text-muted-foreground",
            compact ? "text-sm" : "text-base sm:text-lg",
          )}
        >
          Search care, transport, therapy, employment and home support with access
          needs, funding options and practical next steps in one place.
        </p>

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-lg shadow-primary/5 sm:flex-row sm:items-stretch sm:p-2">
            <label className="relative flex-1">
              <span className="sr-only">What support are you looking for?</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="What support are you looking for?"
                className="min-h-12 w-full rounded-xl border border-input bg-background py-3 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="relative sm:max-w-[220px] sm:flex-1">
              <span className="sr-only">Location</span>
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="text"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="St Ives NSW"
                className="min-h-12 w-full rounded-xl border border-input bg-background py-3 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring"
              />
            </label>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="min-h-12 shrink-0 px-8"
            >
              Find providers
            </Button>
          </div>
        </form>

        {!compact ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {HERO_SUGGESTED_SEARCHES.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary transition hover:border-primary/30 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
