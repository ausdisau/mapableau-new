"use client";

import { useState } from "react";

import { cn } from "@/app/lib/utils";

export type AskMapAbleChoice = {
  id: string;
  label: string;
};

type Props = {
  choices: AskMapAbleChoice[];
  onSelect: (choice: AskMapAbleChoice) => void;
  ariaLabel?: string;
  maxVisible?: number;
  disabled?: boolean;
  className?: string;
};

export function AskMapAbleChoiceChips({
  choices,
  onSelect,
  ariaLabel = "Suggested choices",
  maxVisible = 4,
  disabled = false,
  className,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const safeLimit = Math.max(1, maxVisible);
  const hasMore = choices.length > safeLimit;
  const visibleChoices = expanded ? choices : choices.slice(0, safeLimit);

  if (choices.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="group"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-2"
      >
        {visibleChoices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice)}
            className="min-h-11 rounded-full border border-border bg-card px-4 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {choice.label}
          </button>
        ))}
      </div>

      {hasMore ? (
        <button
          type="button"
          disabled={disabled}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="min-h-11 rounded-lg px-2 py-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {expanded ? "Fewer choices" : `More choices (${choices.length - safeLimit})`}
        </button>
      ) : null}
    </div>
  );
}
