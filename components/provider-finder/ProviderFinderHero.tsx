"use client";

import React from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleProviderSearchForm } from "@/components/search/MapAbleProviderSearchForm";
import { SuggestedSearchChips } from "@/components/search/SuggestedSearchChips";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";
import { HERO_SUGGESTED_SEARCHES } from "@/lib/provider-finder/filters";

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
  isSubmitting?: boolean;
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
  isSubmitting = false,
  compact = false,
}: ProviderFinderHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-[#F7FCFD] via-white to-[hsl(var(--mapable-yellow))]/20",
        compact ? "py-8" : "py-12 sm:py-16 lg:py-20",
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[hsl(var(--mapable-yellow))]/35 blur-3xl motion-reduce:blur-none"
        aria-hidden
      />
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Badge
          variant="outline"
          className={cn("mb-4", mapableEyebrowBadgeClass)}
        >
          Provider Finder
        </Badge>
        <h1
          className={cn(
            "max-w-3xl font-black leading-[0.95] tracking-[-0.055em] text-foreground",
            compact
              ? "text-3xl sm:text-4xl"
              : "text-5xl sm:text-6xl lg:text-7xl",
          )}
        >
          Find support that fits your life.
        </h1>
        <p
          className={cn(
            "mt-6 max-w-2xl leading-8 text-muted-foreground",
            compact ? "text-sm" : "text-base sm:text-lg",
          )}
        >
          Search care, transport, therapy, employment and home support with
          access needs, funding options and practical next steps in one place.
        </p>

        <div className="mt-8 max-w-6xl rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-200/70">
          <MapAbleProviderSearchForm
            context="provider_finder"
            values={{
              query,
              location,
              accessQuery,
              serviceQuery,
              providerName,
            }}
            onQueryChange={onQueryChange}
            onLocationChange={onLocationChange}
            onAccessQueryChange={onAccessQueryChange}
            onServiceQueryChange={onServiceQueryChange}
            onProviderNameChange={onProviderNameChange}
            onSubmit={onSearch}
            onAccessSuggestionSelect={onAccessSuggestionSelect}
            isSubmitting={isSubmitting}
            formId="provider-finder-search"
            showOptionalFields={false}
            variant="hero"
          />
        </div>

        {!compact ? (
          <SuggestedSearchChips
            className="mt-6"
            suggestions={HERO_SUGGESTED_SEARCHES}
            onSelect={onSuggestionClick}
          />
        ) : null}
      </div>
    </section>
  );
}
