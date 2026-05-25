"use client";

import { useEffect, useRef } from "react";

export function MobileProviderSearchSheet({
  open,
  onClose,
  children,
  title = "Refine search",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 md:hidden">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="filter-sheet-title"
        className="relative max-h-[90vh] overflow-y-auto rounded-t-2xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <h2 id="filter-sheet-title" className="font-heading text-lg font-bold">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
        <button
          ref={ref}
          type="button"
          className="mt-4 min-h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground"
          onClick={onClose}
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}
