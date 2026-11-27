export { Skeleton } from "@mapable/ui";

import { Skeleton } from "@mapable/ui";

/** Non-interactive placeholder for loading grids — avoids layout shift. */
export function SearchResultCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-4"
      role="status"
      aria-label="Loading search result"
    >
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-4 h-16 w-full" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
