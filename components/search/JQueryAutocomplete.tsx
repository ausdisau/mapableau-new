"use client";

import React, { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { mapableSearchInputClass } from "@/lib/brand/styles";
import { loadJQueryAutocomplete } from "@/lib/search/jquery-autocomplete-loader";
import {
  buildLiveRegionMessage,
  flattenSuggestions,
} from "@/lib/search/autocomplete-service";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
} from "@/types/search";

export type JQueryAutocompleteProps = {
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
  /** @default 300 */
  debounceMs?: number;
};

type JQueryAutocompleteItem = {
  label: string;
  value: string;
  description?: string;
  typeLabel: string;
  suggestion: AutocompleteSuggestion;
};

type JQueryAutocompleteInstance = JQueryUI.Autocomplete & {
  _renderItem?: (
    ul: JQuery<HTMLElement>,
    item: JQueryAutocompleteItem,
  ) => JQuery<HTMLElement>;
};

export function JQueryAutocomplete({
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
}: JQueryAutocompleteProps) {
  const autoId = useId();
  const inputId = idProp ?? `jq-ac-${autoId}`;
  const liveId = `${inputId}-live`;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const callbacksRef = useRef({ onChange, onSelect });
  const abortControllerRef = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const [liveQuery, setLiveQuery] = useState(value);
  const [statusOverride, setStatusOverride] = useState("");

  useEffect(() => {
    callbacksRef.current = { onChange, onSelect };
  }, [onChange, onSelect]);

  useEffect(() => {
    setLiveQuery(value);
    if (value.trim().length < 2) {
      setSuggestionCount(0);
      setStatusOverride("");
    }
  }, [value]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    let destroyed = false;
    let $input: JQuery<HTMLInputElement> | null = null;

    void loadJQueryAutocomplete()
      .then(($) => {
        if (destroyed || !inputRef.current) return;

        $input = $(inputRef.current);
        $input.autocomplete({
          appendTo: containerRef.current ?? undefined,
          autoFocus: false,
          delay: debounceMs,
          disabled,
          minLength: 2,
          classes: {
            "ui-autocomplete":
              "z-50 max-h-72 overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg",
          },
          source: (
            request: { term: string },
            response: (items: JQueryAutocompleteItem[]) => void,
          ) => {
            const query = request.term.trim();
            setLiveQuery(query);
            setStatusOverride("");

            if (query.length < 2) {
              setSuggestionCount(0);
              response([]);
              return;
            }

            abortControllerRef.current?.abort();
            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            setLoading(true);

            const params = new URLSearchParams({
              q: query,
              context,
              field,
            });

            fetch(`/api/search/autocomplete?${params.toString()}`, {
              signal: abortController.signal,
            })
              .then(async (res) => {
                if (!res.ok) return [];
                const data = (await res.json()) as {
                  groups: AutocompleteGroupedResult;
                };
                return flattenSuggestions(data.groups);
              })
              .then((suggestions) => {
                if (destroyed || abortController.signal.aborted) return;
                setSuggestionCount(suggestions.length);
                response(
                  suggestions.map((suggestion) => ({
                    label: suggestion.label,
                    value: suggestion.value,
                    description: suggestion.description,
                    typeLabel: suggestion.typeLabel,
                    suggestion,
                  })),
                );
              })
              .catch((error: unknown) => {
                if (
                  destroyed ||
                  abortController.signal.aborted ||
                  (error instanceof DOMException && error.name === "AbortError")
                ) {
                  return;
                }
                setSuggestionCount(0);
                response([]);
              })
              .finally(() => {
                if (!destroyed && !abortController.signal.aborted) {
                  setLoading(false);
                }
              });
          },
          select: (event, ui) => {
            event.preventDefault();
            const selected = (ui.item as JQueryAutocompleteItem).suggestion;
            inputRef.current?.focus();
            if (inputRef.current) inputRef.current.value = selected.value;
            callbacksRef.current.onChange(selected.value);
            callbacksRef.current.onSelect?.(selected);
            setOpen(false);
            setSuggestionCount(0);
          },
          focus: (event) => {
            event.preventDefault();
          },
        });

        const instance = $input.autocomplete("instance") as unknown as
          | JQueryAutocompleteInstance
          | undefined;
        if (instance) {
          instance._renderItem = (ul, item) => {
            const $item = $("<li>");
            const $row = $("<div>").addClass(
              "cursor-pointer rounded-lg px-3 py-2.5 text-sm outline-none",
            );
            const $heading = $("<div>").addClass(
              "flex items-start justify-between gap-2",
            );
            $("<span>").addClass("font-medium").text(item.label).appendTo($heading);
            $("<span>")
              .addClass(
                "shrink-0 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground",
              )
              .text(item.typeLabel)
              .appendTo($heading);
            $heading.appendTo($row);
            if (item.description) {
              $("<span>")
                .addClass("mt-0.5 block text-xs text-muted-foreground")
                .text(item.description)
                .appendTo($row);
            }
            return $item.append($row).appendTo(ul);
          };
        }

        $input
          .on("autocompleteopen.mapableJqAutocomplete", () => setOpen(true))
          .on("autocompleteclose.mapableJqAutocomplete", () => setOpen(false));
      })
      .catch(() => {
        if (!destroyed) {
          setStatusOverride(
            "Autocomplete suggestions are unavailable. You can still type your search.",
          );
        }
      });

    return () => {
      destroyed = true;
      abortControllerRef.current?.abort();
      if ($input) {
        $input.off(".mapableJqAutocomplete");
        if ($input.data("ui-autocomplete")) {
          $input.autocomplete("destroy");
        }
      }
    };
  }, [context, debounceMs, disabled, field]);

  const liveMessage =
    statusOverride ||
    buildLiveRegionMessage(loading, suggestionCount, liveQuery || value);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
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
          aria-expanded={open}
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
            setLiveQuery(e.target.value);
            setStatusOverride("");
            callbacksRef.current.onChange(e.target.value);
          }}
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
    </div>
  );
}
