"use client";

import { useEffect, useRef } from "react";

import { ASK_MAPABLE_NAME } from "@/lib/ask-mapable";

type Props = {
  open: boolean;
  onToggle: () => void;
  labelledBy?: string;
};

export function AskMapAbleLauncher({ open, onToggle }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      // Focus return is handled by panel close; keep ref available.
    }
  }, [open]);

  return (
    <button
      ref={ref}
      type="button"
      data-testid="ask-mapable-launcher"
      className="fixed bottom-4 right-4 z-[45] flex size-14 min-h-14 min-w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:scale-105"
      aria-label={open ? `Close ${ASK_MAPABLE_NAME}` : `Open ${ASK_MAPABLE_NAME}`}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls="ask-mapable-panel"
      onClick={onToggle}
    >
      <span className="font-heading text-sm font-semibold" aria-hidden>
        MA
      </span>
    </button>
  );
}
