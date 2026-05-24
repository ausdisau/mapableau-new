"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { mapableSearchInputClass } from "@/lib/brand/styles";
import {
  buildLiveRegionMessage,
  flattenSuggestions,
} from "@/lib/search/autocomplete-service";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
} from "@/types/search";

export type AccessibleAutocompleteProps = {
  id?: string;
  label: string;
  placeholder?: string;
  context: AutocompleteContext;
  field?: AutocompleteField;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AutocompleteSuggestion) => void;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
  /** @default 300 — use 0 in tests */
  debounceMs?: number;
};

export function AccessibleAutocomplete({
  id: idProp,
  label,
  placeholder,
  context,
  field = "all",
  value,
  onChange,
  onSelect,
  helperText,
  disabled = false,
  required = false,
  className,
  inputClassName,
  icon,
  debounceMs = 300,
}: AccessibleAutocompleteProps) {
  const autoId = useId();
  const inputId = idProp ?? `ac-${autoId}`;
  const listboxId = `${inputId}-listbox`;
  const liveId = `${inputId}-live`;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<AutocompleteGroupedResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(value, debounceMs);
  const suggestions = groups ? flattenSuggestions(groups) : [];
  const liveMessage = buildLiveRegionMessage(loading, suggestions.length, value);

  const fetchSuggestions = useCallback(async () => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setGroups(null);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        context,
        field,
      });
      const res = await fetch(`/api/search/autocomplete?${params.toString()}`);
      if (!res.ok) {
        setGroups(null);
        return;
      }
      const data = (await res.json()) as { groups: AutocompleteGroupedResult };
      setGroups(data.groups);
      setActiveIndex(-1);
    } catch {
      setGroups(null);
    } finally {
      setLoading(false);
    }
  }, [context, debouncedQuery, field]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  function selectSuggestion(suggestion: AutocompleteSuggestion) {
    onChange(suggestion.value);
    onSelect?.(suggestion);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
    // Tab moves focus naturally — do not trap
  }

  const showList = open && !disabled && debouncedQuery.trim().length >= 2;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>

      <div className="relative mt-1.5">
        {icon ? (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? listboxId : undefined}
          aria-activedescendant={
            showList && activeIndex >= 0
              ? `${inputId}-option-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-describedby={
            [helperId, liveId].filter(Boolean).join(" ") || undefined
          }
          autoComplete="off"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            mapableSearchInputClass,
            icon ? "pl-10" : "pl-3",
            inputClassName,
          )}
        />
      </div>

      {helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}

      <p id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {suggestions.length === 0 && !loading ? (
            <li
              className="px-3 py-2.5 text-sm text-muted-foreground"
              role="presentation"
            >
              No matches. Try different words.
            </li>
          ) : null}
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${inputId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2.5 text-sm outline-none",
                index === activeIndex
                  ? "bg-accent text-accent-foreground ring-2 ring-ring"
                  : "hover:bg-muted",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{suggestion.label}</span>
                <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                  {suggestion.typeLabel}
                </span>
              </div>
              {suggestion.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {suggestion.description}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
