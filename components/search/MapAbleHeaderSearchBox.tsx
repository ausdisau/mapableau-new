"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useId, useRef, useState, useTransition } from "react";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  SEARCH_QUERY_MAX,
  buildMapAbleSearchUrl,
  createDefaultSearchSelection,
  validateSearchQuery,
} from "@/lib/search/mapable-search-ui";

type Props = {
  id?: string;
  className?: string;
  compact?: boolean;
  onNavigated?: () => void;
};

/**
 * Compact Bing/Google-style omnibox for the marketing header.
 * Navigates to `/search` (Web · Quick) — does not call the search API itself.
 */
export function MapAbleHeaderSearchBox({
  id = "mapable-header-search",
  className,
  compact = false,
  onNavigated,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const reactId = useId();
  const inputId = `${id}-input`;
  const errorId = `${id}-error-${reactId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | undefined>();

  function clearDraft() {
    setDraft("");
    setError(undefined);
    inputRef.current?.focus();
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const validated = validateSearchQuery(draft);
    if (!validated.ok) {
      setError(validated.error);
      inputRef.current?.focus();
      return;
    }
    if (!validated.query) {
      setError("Enter a search to continue.");
      inputRef.current?.focus();
      return;
    }
    setError(undefined);
    const url = buildMapAbleSearchUrl(
      createDefaultSearchSelection({
        query: validated.query,
        presentation: "web",
        tier: "quick",
      }),
    );
    startTransition(() => {
      router.push(url);
      onNavigated?.();
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (draft) {
        setDraft("");
        setError(undefined);
        return;
      }
      inputRef.current?.blur();
    }
  }

  return (
    <div
      id={id}
      role="search"
      aria-label="MapAble Search"
      tabIndex={-1}
      className={cn("min-w-0", className)}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex min-h-12 items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-2 shadow-sm transition focus-within:border-[#005B7F] focus-within:ring-4 focus-within:ring-[#F8C51C]/30",
          compact ? "w-full" : "w-full max-w-xl",
        )}
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#005B7F]">
          <Search className="h-5 w-5" aria-hidden />
        </span>
        <label htmlFor={inputId} className="sr-only">
          Search MapAble
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={SEARCH_QUERY_MAX}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(undefined);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search places, services, transport, jobs…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={isPending}
          className={cn(
            "min-h-12 min-w-0 flex-1 border-0 bg-transparent py-2 text-base text-[#0C1833] outline-none placeholder:text-slate-500 disabled:opacity-60",
            // Hide native search clear so our labelled Clear control stays consistent.
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          )}
        />
        {draft ? (
          <button
            type="button"
            onClick={clearDraft}
            className={cn(
              "inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-[#0C1833] hover:bg-slate-50",
              mapableCareFocusRing,
            )}
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Clear</span>
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#005B7F] px-3 text-sm font-black text-white transition hover:bg-[#004766] disabled:opacity-60 sm:px-4",
            mapableCareFocusRing,
          )}
        >
          Search
        </button>
      </form>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-xs font-semibold text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
