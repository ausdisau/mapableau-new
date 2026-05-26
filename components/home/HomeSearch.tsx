"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleProviderSearchForm } from "@/components/search/MapAbleProviderSearchForm";
import { SuggestedSearchChips } from "@/components/search/SuggestedSearchChips";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";
import {
  ACCESS_NEEDS,
  HERO_SUGGESTED_SEARCHES,
} from "@/lib/provider-finder/filters";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [accessQuery, setAccessQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [providerName, setProviderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function navigateToFinder() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    if (accessQuery.trim()) params.set("access", accessQuery.trim());
    if (serviceQuery.trim()) params.set("service", serviceQuery.trim());
    if (providerName.trim()) params.set("provider", providerName.trim());
    const qs = params.toString();
    router.push(qs ? `/provider-finder?${qs}` : "/provider-finder");
  }

  function handleAccessSuggestion(label: string) {
    const match = ACCESS_NEEDS.find(
      (n) =>
        n.label.toLowerCase() === label.toLowerCase() ||
        n.keywords.some((kw) => label.toLowerCase().includes(kw)),
    );
    if (match) {
      setAccessQuery(match.label);
    }
  }

  function applyChip(suggestion: string) {
    setQuery(suggestion);
  }

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-[#F7FCFD] via-white to-[hsl(var(--mapable-yellow))]/20 py-12 sm:py-16 lg:py-20"
    >
      <div
        className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[hsl(var(--mapable-yellow))]/35 blur-3xl motion-reduce:blur-none"
        aria-hidden
      />
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="max-w-4xl">
          <Badge
            variant="outline"
            className={cn("mb-5 w-fit", mapableEyebrowBadgeClass)}
          >
            Provider Finder
          </Badge>
          <h1
            id="home-hero-heading"
            className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl"
          >
            Find support that fits your life.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
            Search care, transport, therapy, employment and home support with
            access needs, funding options and practical next steps in one place.
          </p>
        </div>

        <div className="mt-8 max-w-6xl rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-200/70">
          <MapAbleProviderSearchForm
            context="homepage"
            values={{
              query,
              location,
              accessQuery,
              serviceQuery,
              providerName,
            }}
            onQueryChange={setQuery}
            onLocationChange={setLocation}
            onAccessQueryChange={setAccessQuery}
            onServiceQueryChange={setServiceQuery}
            onProviderNameChange={setProviderName}
            onSubmit={() => {
              setIsSubmitting(true);
              navigateToFinder();
            }}
            onAccessSuggestionSelect={handleAccessSuggestion}
            isSubmitting={isSubmitting}
            showOptionalFields={false}
            formId="home-provider-search"
            autocompleteMode="jquery"
            variant="hero"
          />
          <SuggestedSearchChips
            className="px-2 pb-2 pt-3"
            suggestions={HERO_SUGGESTED_SEARCHES}
            onSelect={applyChip}
          />
        </div>
      </div>
    </section>
  );
}
