"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useId, useState, useTransition } from "react";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapableSearchInputClass } from "@/lib/brand/styles";
import {
  SEARCH_CATEGORIES,
  SEARCH_QUERY_MAX,
  buildMapAbleSearchUrl,
  createDefaultSearchSelection,
  deepSearchAvailable,
  validateSearchQuery,
  withCategory,
  withPresentation,
  withTier,
  type SearchCategory,
  type SearchPresentation,
  type SearchSelection,
  type SearchTier,
} from "@/lib/search/mapable-search-ui";

type Props = {
  initialSelection?: SearchSelection;
  onSelectionChange?: (selection: SearchSelection) => void;
  onSearch?: (selection: SearchSelection) => void;
  className?: string;
};

const radioItemClass = cn(
  "inline-flex min-h-11 min-w-[5.5rem] cursor-pointer items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-black text-[#0C1833] transition has-[:checked]:border-[#005B7F] has-[:checked]:bg-[#005B7F]/10 has-[:checked]:text-[#005B7F]",
  mapableCareFocusRing,
);

export function MapAbleSearchForm({
  initialSelection,
  onSelectionChange,
  onSearch,
  className,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const baseId = useId();
  const [selection, setSelection] = useState<SearchSelection>(
    () => initialSelection ?? createDefaultSearchSelection(),
  );
  const [queryError, setQueryError] = useState<string | undefined>();

  function update(next: SearchSelection) {
    setSelection(next);
    onSelectionChange?.(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validated = validateSearchQuery(selection.query);
    if (!validated.ok) {
      setQueryError(validated.error);
      return;
    }
    setQueryError(undefined);

    const next: SearchSelection = {
      ...selection,
      query: validated.query,
      // Deep never triggers spend; keep selection but route as free search.
      tier: selection.tier === "deep" && !deepSearchAvailable ? "deep" : selection.tier,
    };

    if (next.presentation === "conversation") {
      onSearch?.(next);
      const url = buildMapAbleSearchUrl(next);
      startTransition(() => {
        router.push(url);
      });
      return;
    }

    onSearch?.(next);
    startTransition(() => {
      router.push(buildMapAbleSearchUrl(next));
    });
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("space-y-5", className)}
      aria-describedby={`${baseId}-help`}
    >
      <div className="space-y-2">
        <label
          htmlFor={`${baseId}-q`}
          className="block text-sm font-black text-[#0C1833]"
        >
          Search MapAble
        </label>
        <input
          id={`${baseId}-q`}
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck
          maxLength={SEARCH_QUERY_MAX}
          value={selection.query}
          onChange={(event) => {
            update({ ...selection, query: event.target.value });
            if (queryError) setQueryError(undefined);
          }}
          placeholder="e.g. accessible café, support provider, transport"
          className={mapableSearchInputClass}
          aria-invalid={queryError ? true : undefined}
          aria-describedby={
            queryError ? `${baseId}-q-error ${baseId}-help` : `${baseId}-help`
          }
        />
        {queryError ? (
          <p id={`${baseId}-q-error`} role="alert" className="text-sm text-red-700">
            {queryError}
          </p>
        ) : null}
      </div>

      <div>
        <p id={`${baseId}-categories-label`} className="mb-2 text-sm font-black text-[#0C1833]">
          Categories
        </p>
        <ul
          aria-labelledby={`${baseId}-categories-label`}
          className="flex flex-wrap gap-2"
        >
          <li>
            <button
              type="button"
              aria-pressed={selection.category === "all"}
              onClick={() => update(withCategory(selection, "all"))}
              className={cn(
                "inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-black",
                selection.category === "all"
                  ? "bg-[#005B7F] text-white"
                  : "border border-slate-200 bg-white text-[#0C1833] hover:bg-slate-50",
                mapableCareFocusRing,
              )}
            >
              All
            </button>
          </li>
          {SEARCH_CATEGORIES.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                aria-pressed={selection.category === category.id}
                onClick={() =>
                  update(withCategory(selection, category.id as SearchCategory))
                }
                className={cn(
                  "inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-black",
                  selection.category === category.id
                    ? "bg-[#005B7F] text-white"
                    : "border border-slate-200 bg-white text-[#0C1833] hover:bg-slate-50",
                  mapableCareFocusRing,
                )}
              >
                {category.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-600">
          Or browse directly:{" "}
          {SEARCH_CATEGORIES.map((category, index) => (
            <React.Fragment key={category.id}>
              {index > 0 ? " · " : null}
              <Link
                href={category.href}
                className={cn("font-semibold text-[#005B7F] underline", mapableCareFocusRing)}
              >
                {category.label}
              </Link>
            </React.Fragment>
          ))}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-black text-[#0C1833]">Search experience</legend>
        <div
          role="radiogroup"
          aria-label="Search experience"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              ["web", "Web"],
              ["conversation", "Conversation"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={radioItemClass}>
              <input
                type="radio"
                name={`${baseId}-presentation`}
                value={value}
                checked={selection.presentation === value}
                onChange={() =>
                  update(withPresentation(selection, value as SearchPresentation))
                }
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-black text-[#0C1833]">Search depth</legend>
        <div
          role="radiogroup"
          aria-label="Search depth"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              ["quick", "Quick · Free"],
              ["deep", "Deep · Credits"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={radioItemClass}>
              <input
                type="radio"
                name={`${baseId}-tier`}
                value={value}
                checked={selection.tier === value}
                onChange={() => update(withTier(selection, value as SearchTier))}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {!deepSearchAvailable ? (
          <p className="text-xs text-slate-600">
            Deep · Credits is shown for transparency but spending is disabled.
            Choosing it will not charge credits or open an account.
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex min-h-12 min-w-[8rem] items-center justify-center rounded-xl bg-[#005B7F] px-6 text-base font-black text-white shadow-sm transition hover:bg-[#004766] disabled:opacity-70",
            mapableCareFocusRing,
          )}
        >
          {isPending ? "Searching…" : "Search"}
        </button>
        <Link
          href="/ask"
          className={cn(
            "inline-flex min-h-12 items-center rounded-xl border-2 border-[#00A979] px-4 text-sm font-black text-[#00A979] hover:bg-[#00A979]/5",
            mapableCareFocusRing,
          )}
        >
          MapAble Access Assistant
        </Link>
      </div>

      <p id={`${baseId}-help`} className="text-xs text-slate-600">
        No diagnosis or account is required for Quick Search. Switching Web and
        Conversation does not change your Quick or Deep selection. Deep Search
        never auto-starts AI calls or purchases.
      </p>
    </form>
  );
}
