"use client";

import { AccessSearchBar } from "@/components/access/AccessSearchBar";

export function GoSearch({
  query,
  onQueryChange,
  onSearch,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <section aria-labelledby="go-search-heading">
      <h2 id="go-search-heading" className="text-lg font-semibold">
        Where do you want to go?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Search published Access places. You choose the route — MapAble Go shows evidence and
        uncertainty, not a single &quot;safe&quot; label.
      </p>
      <div className="mt-3">
        <AccessSearchBar value={query} onChange={onQueryChange} onSubmit={onSearch} />
      </div>
    </section>
  );
}
