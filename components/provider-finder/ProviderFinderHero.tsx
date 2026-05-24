"use client";

import { MapPin, Search } from "lucide-react";

import { cn } from "@/app/lib/utils";
import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";
import { HERO_SUGGESTED_SEARCHES } from "@/lib/provider-finder/filters";
import type { AutocompleteSuggestion } from "@/types/search";

type ProviderFinderHeroProps = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onProviderNameChange: (value: string) => void;
  onServiceQueryChange: (value: string) => void;
  onAccessQueryChange: (value: string) => void;
  onSearch: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onAccessSuggestionSelect?: (label: string) => void;
  compact?: boolean;
};

export function ProviderFinderHero({
  query,
  location,
  providerName,
  serviceQuery,
  accessQuery,
  onQueryChange,
  onLocationChange,
  onProviderNameChange,
  onServiceQueryChange,
  onAccessQueryChange,
  onSearch,
  onSuggestionClick,
  onAccessSuggestionSelect,
  compact = false,
}: ProviderFinderHeroProps) {
  function mergeQueryFromSuggestion(suggestion: AutocompleteSuggestion) {
    if (suggestion.type === "provider") {
      onProviderNameChange(suggestion.value);
      onQueryChange(suggestion.value);
      return;
    }
    if (suggestion.type === "service" || suggestion.type === "popular_search") {
      onServiceQueryChange(suggestion.value);
      onQueryChange(suggestion.value);
      return;
    }
    if (suggestion.type === "location") {
      onLocationChange(suggestion.value);
      return;
    }
    if (suggestion.type === "accessibility_feature") {
      onAccessQueryChange(suggestion.value);
      onAccessSuggestionSelect?.(suggestion.value);
      onQueryChange(suggestion.value);
      return;
    }
    onQueryChange(suggestion.value);
  }

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
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-lg shadow-primary/5 sm:p-4">
            <AccessibleAutocomplete
              id="pf-query"
              label="What support are you looking for?"
              placeholder="Service, access need, or keyword"
              context="provider_finder"
              field="all"
              value={query}
              onChange={onQueryChange}
              onSelect={mergeQueryFromSuggestion}
              icon={<Search className="h-4 w-4" aria-hidden />}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <AccessibleAutocomplete
                id="pf-provider-name"
                label="Provider name (optional)"
                placeholder="Provider or organisation"
                context="provider_finder"
                field="provider"
                value={providerName}
                onChange={(v) => {
                  onProviderNameChange(v);
                }}
                onSelect={(s) => {
                  onProviderNameChange(s.value);
                  onQueryChange(s.value);
                }}
              />
              <AccessibleAutocomplete
                id="pf-service"
                label="Service (optional)"
                placeholder="e.g. physiotherapy"
                context="provider_finder"
                field="service"
                value={serviceQuery}
                onChange={onServiceQueryChange}
                onSelect={(s) => {
                  onServiceQueryChange(s.value);
                  onQueryChange(s.value);
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <AccessibleAutocomplete
                id="pf-location"
                label="Location"
                placeholder="Suburb or postcode"
                context="provider_finder"
                field="location"
                value={location}
                onChange={onLocationChange}
                onSelect={(s) => onLocationChange(s.value)}
                icon={<MapPin className="h-4 w-4" aria-hidden />}
              />
              <AccessibleAutocomplete
                id="pf-access"
                label="Access needs (optional)"
                placeholder="e.g. wheelchair accessible"
                context="provider_finder"
                field="accessibility"
                value={accessQuery}
                onChange={onAccessQueryChange}
                onSelect={(s) => {
                  onAccessQueryChange(s.value);
                  onAccessSuggestionSelect?.(s.value);
                }}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="min-h-12 w-full shrink-0 sm:w-auto sm:self-end"
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
