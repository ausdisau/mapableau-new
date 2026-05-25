"use client";

import { cn } from "@/app/lib/utils";

type SponsoredLabelProps = {
  className?: string;
  compact?: boolean;
};

export function SponsoredLabel({ className, compact }: SponsoredLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-amber-500/40 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
      aria-label="Sponsored"
    >
      Sponsored
    </span>
  );
}
