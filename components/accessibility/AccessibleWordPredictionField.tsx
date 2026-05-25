"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import {
  buildPredictionLiveMessage,
} from "@/lib/word-prediction/prediction-service";
import { insertAtCaret, currentWordPrefix } from "@/lib/word-prediction/caret-utils";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { PredictionContext, PredictionSuggestion } from "@/types/word-prediction";

export type AccessibleWordPredictionFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  context: PredictionContext;
  enabled?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  describedBy?: string;
};

export function AccessibleWordPredictionField({
  id: idProp,
  label,
  value,
  onChange,
  context,
  enabled = true,
  rows = 4,
  placeholder,
  disabled = false,
  required = false,
  className,
  describedBy,
}: AccessibleWordPredictionFieldProps) {
  const autoId = useId();
  const inputId = idProp ?? `wp-${autoId}`;
  const listboxId = `${inputId}-listbox`;
  const liveId = `${inputId}-live`;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PredictionSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [caret, setCaret] = useState(0);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedValue = useDebouncedValue(value, 250);
  const liveMessage = buildPredictionLiveMessage(loading, suggestions.length);

  const fetchSuggestions = useCallback(async () => {
    if (!enabled) {
      setSuggestions([]);
      return;
    }
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? value.length;
    setCaret(pos);
    const prefix = currentWordPrefix(value, pos);
    if (prefix.length < 1 && value.trim().length > 0 && pos === value.length) {
      setSuggestions([]);
      return;
    }
    if (prefix.length < 1 && value.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: value,
        context,
        caret: String(pos),
        limit: "8",
      });
      const res = await fetch(`/api/word-prediction/suggest?${params}`);
      const data = await res.json();
      if (res.ok && !data.disabled) {
        setSuggestions(data.suggestions ?? []);
        setActiveIndex(-1);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [context, debouncedValue, enabled, value]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  function selectSuggestion(suggestion: PredictionSuggestion) {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? value.length;
    const prefixLen = currentWordPrefix(value, pos).length;
    const { nextValue, nextCaret } = insertAtCaret(
      value,
      pos,
      suggestion.text,
      prefixLen
    );
    onChange(nextValue);
    setOpen(false);
    setActiveIndex(-1);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(nextCaret, nextCaret);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!enabled || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && open) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList =
    enabled && open && !disabled && suggestions.length > 0;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>

      <textarea
        ref={textareaRef}
        id={inputId}
        rows={rows}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && activeIndex >= 0
            ? `${inputId}-option-${activeIndex}`
            : undefined
        }
        aria-describedby={[describedBy, liveId].filter(Boolean).join(" ") || undefined}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        value={value}
        className={`${formInputClass} mt-1.5 min-h-[44px] w-full`}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart);
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
        onSelect={(e) =>
          setCaret((e.target as HTMLTextAreaElement).selectionStart)
        }
        onClick={(e) =>
          setCaret((e.target as HTMLTextAreaElement).selectionStart)
        }
      />

      <div id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover shadow-md"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${inputId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                "cursor-pointer px-4 py-3 text-sm min-h-[44px] flex items-center",
                i === activeIndex ? "bg-accent" : "hover:bg-accent/50"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
            >
              <span className="mr-2 text-xs uppercase text-muted-foreground">
                {s.kind === "phrase" ? "Phrase" : "Word"}
              </span>
              {s.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
