"use client";

import { useEffect, useRef } from "react";

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
      aria-label={open ? "Close Ask MapAble" : "Open Ask MapAble"}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls="ask-mapable-panel"
      onClick={onToggle}
    >
      <span className="font-heading text-sm font-semibold" aria-hidden>
        Ask
      </span>
    </button>
  );
}
