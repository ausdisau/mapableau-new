"use client";

import { cn } from "@/app/lib/utils";

type ProviderFinderAccessLayerProps = {
  className?: string;
};

/** Slim map legend for Provider Finder (layers render on MapLibre). */
export function ProviderFinderAccessLayer({
  className,
}: ProviderFinderAccessLayerProps) {
  return (
    <aside
      className={cn(
        "hidden xl:flex xl:w-56 xl:shrink-0 xl:flex-col",
        className,
      )}
      aria-label="Map legend"
    >
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Map legend
        </p>
        <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-700" aria-hidden />
            NDIS providers
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" aria-hidden />
            Access places
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-600" aria-hidden />
            Care shifts (signed in)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden />
            Transport routes (signed in)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-600" aria-hidden />
            Search area
          </li>
        </ul>
      </div>
    </aside>
  );
}
