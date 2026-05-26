"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/app/lib/utils";
import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import { JQueryAutocomplete } from "@/components/search/JQueryAutocomplete";
import { SearchTrustRow } from "@/components/search/SearchTrustRow";
import { Button } from "@/components/ui/button";
import { mapableSearchFieldSecondaryClass } from "@/lib/brand/styles";
import { MAPABLE_PROVIDER_SEARCH_FIELD_SCHEMA } from "@/lib/provider-finder/provider-search-field-schema";
import type {
  AutocompleteContext,
  AutocompleteSuggestion,
} from "@/types/search";

export type MapAbleProviderSearchFormValues = {
  query: string;
  location: string;
  accessQuery: string;
  serviceQuery: string;
  providerName: string;
};

type MapAbleProviderSearchFormProps = {
  context: AutocompleteContext;
  values: MapAbleProviderSearchFormValues;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onAccessQueryChange: (value: string) => void;
  onServiceQueryChange: (value: string) => void;
  onProviderNameChange: (value: string) => void;
  onSubmit: () => void;
  onAccessSuggestionSelect?: (label: string) => void;
  isSubmitting?: boolean;
  showOptionalFields?: boolean;
  formId?: string;
  className?: string;
  autocompleteMode?: "accessible" | "jquery";
  variant?: "stacked" | "hero";
};

export function MapAbleProviderSearchForm({
  context,
  values,
  onQueryChange,
  onLocationChange,
  onAccessQueryChange,
  onServiceQueryChange,
  onProviderNameChange,
  onSubmit,
  onAccessSuggestionSelect,
  isSubmitting = false,
  showOptionalFields = true,
  formId = "mapable-provider-search",
  className,
  autocompleteMode = "accessible",
  variant = "stacked",
}: MapAbleProviderSearchFormProps) {
  const [statusMessage, setStatusMessage] = useState("");

  const idPrefix = context === "homepage" ? "home" : "pf";
  const Autocomplete =
    autocompleteMode === "jquery" ? JQueryAutocomplete : AccessibleAutocomplete;
  const isHero = variant === "hero";

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
      return;
    }
    onQueryChange(suggestion.value);
  }

  return (
    <form
      id={formId}
      className={cn("text-left", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setStatusMessage("Searching for matching providers.");
        onSubmit();
      }}
    >
      <div
        className={cn(
          "rounded-[1.4rem] border border-slate-200 bg-white",
          isHero
            ? "p-3 shadow-xl shadow-slate-200/70"
            : "flex flex-col gap-4 p-4 shadow-sm sm:p-5",
        )}
      >
        <div
          className={cn(
            isHero
              ? "grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.75fr)_auto]"
              : "contents",
          )}
        >
          <Autocomplete
            id={`${idPrefix}-search-primary`}
            label="Search for support"
            placeholder={
              isHero
                ? "What support are you looking for?"
                : 'Try "support worker", "wheelchair transport" or "OT"'
            }
            context={context}
            field={MAPABLE_PROVIDER_SEARCH_FIELD_SCHEMA.all.autocompleteField}
            value={values.query}
            onChange={onQueryChange}
            onSelect={mergeQueryFromSuggestion}
            disabled={isSubmitting}
            icon={<Search className="h-4 w-4" aria-hidden />}
          />

          <div className={cn(!isHero && "grid gap-3 sm:grid-cols-2")}>
            <Autocomplete
              id={`${idPrefix}-location`}
              label="Postcode or suburb"
              placeholder="Suburb or postcode"
              context={context}
              field={
                MAPABLE_PROVIDER_SEARCH_FIELD_SCHEMA.location.autocompleteField
              }
              value={values.location}
              onChange={onLocationChange}
              onSelect={(s) => onLocationChange(s.value)}
              disabled={isSubmitting}
              icon={<MapPin className="h-4 w-4" aria-hidden />}
              helperText={
                isHero
                  ? undefined
                  : "Uses MapAble’s local location list — not a public geocoding API."
              }
            />
            {!isHero ? (
              <Autocomplete
                id={`${idPrefix}-access`}
                label="Access needs"
                placeholder="Wheelchair access, Auslan, low sensory..."
                context={context}
                field={
                  MAPABLE_PROVIDER_SEARCH_FIELD_SCHEMA.accessibility
                    .autocompleteField
                }
                value={values.accessQuery}
                onChange={onAccessQueryChange}
                onSelect={(s) => {
                  onAccessQueryChange(s.value);
                  onAccessSuggestionSelect?.(s.value);
                }}
                disabled={isSubmitting}
              />
            ) : null}
          </div>

          {isHero ? (
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="min-h-12 w-full rounded-xl px-6 font-black lg:w-auto"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Finding…
                </>
              ) : (
                "Find providers"
              )}
            </Button>
          ) : null}
        </div>

        {showOptionalFields && !isHero ? (
          <div
            className={cn(
              "grid gap-3 sm:grid-cols-2",
              mapableSearchFieldSecondaryClass,
            )}
          >
            <Autocomplete
              id={`${idPrefix}-service`}
              label="Service type (optional)"
              placeholder="e.g. physiotherapy"
              context={context}
              field={
                MAPABLE_PROVIDER_SEARCH_FIELD_SCHEMA.service.autocompleteField
              }
              value={values.serviceQuery}
              onChange={onServiceQueryChange}
              onSelect={(s) => {
                onServiceQueryChange(s.value);
                onQueryChange(s.value);
              }}
              disabled={isSubmitting}
            />
            <Autocomplete
              id={`${idPrefix}-provider`}
              label="Provider name (optional)"
              placeholder="Provider or organisation"
              context={context}
              field={
                MAPABLE_PROVIDER_SEARCH_FIELD_SCHEMA.provider.autocompleteField
              }
              value={values.providerName}
              onChange={onProviderNameChange}
              onSelect={(s) => {
                onProviderNameChange(s.value);
                onQueryChange(s.value);
              }}
              disabled={isSubmitting}
            />
          </div>
        ) : null}

        {!isHero ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {statusMessage}
            </p>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="min-h-11 w-full rounded-xl font-black sm:min-h-12 sm:w-auto sm:px-10"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Finding providers…
                </>
              ) : (
                "Find matching providers"
              )}
            </Button>
          </div>
        ) : (
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {statusMessage}
          </p>
        )}

        {!isHero ? <SearchTrustRow /> : null}
      </div>
    </form>
  );
}
