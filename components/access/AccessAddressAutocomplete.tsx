"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { AccessGeoPlaceDetails, AccessGeoSuggestion } from "@/types/access-geo";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPlaceResolved: (place: AccessGeoPlaceDetails) => void;
  disabled?: boolean;
  bias?: { latitude: number; longitude: number };
};

export function AccessAddressAutocomplete({
  value,
  onChange,
  onPlaceResolved,
  disabled = false,
  bias,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AccessGeoSuggestion[]>([]);
  const [geoEnabled, setGeoEnabled] = useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedQuery = useDebouncedValue(value, 300);

  useEffect(() => {
    fetch("/api/access/geo/status")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => setGeoEnabled(Boolean(d.enabled)))
      .catch(() => setGeoEnabled(false));
  }, []);

  const fetchSuggestions = useCallback(async () => {
    const q = debouncedQuery.trim();
    if (!geoEnabled || q.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (bias) {
        params.set("lat", String(bias.latitude));
        params.set("lng", String(bias.longitude));
      }
      const res = await fetch(`/api/access/geo/autocomplete?${params}`);
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = (await res.json()) as { suggestions: AccessGeoSuggestion[] };
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [bias, debouncedQuery, geoEnabled]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  async function selectSuggestion(suggestion: AccessGeoSuggestion) {
    onChange(suggestion.label);
    setOpen(false);
    setSuggestions([]);

    const res = await fetch(
      `/api/access/geo/place?placeId=${encodeURIComponent(suggestion.placeId)}`
    );
    if (!res.ok) return;
    const data = (await res.json()) as { place: AccessGeoPlaceDetails };
    onPlaceResolved(data.place);
  }

  if (geoEnabled === false) {
    return (
      <p className="text-sm text-muted-foreground">
        Address search is unavailable. Enter the address and coordinates manually,
        or ask an administrator to enable Amazon Location Service.
      </p>
    );
  }

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="text-sm font-medium">
        Street address
      </label>
      <input
        id={`${listId}-input`}
        type="text"
        name="addressSearch"
        autoComplete="street-address"
        disabled={disabled || geoEnabled === null}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (!open || !suggestions.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            void selectSuggestion(suggestions[activeIndex]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={`${listId}-listbox`}
        aria-autocomplete="list"
        className="mt-1 min-h-11 w-full rounded-lg border px-3"
        placeholder="Start typing an Australian address…"
      />
      {loading ? (
        <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
          Searching addresses…
        </p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-background py-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((s, index) => (
            <li key={s.placeId} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  index === activeIndex && "bg-muted"
                )}
                onClick={() => void selectSuggestion(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
