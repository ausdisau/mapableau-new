"use client";

import type {
  FinderDiscoveryMatch,
  FinderSearchScope,
} from "@/lib/provider/finder/personalisation/matching";

export type FinderDiscoveryMeta = {
  personalised: boolean;
  scope: FinderSearchScope;
  workerNotice: string;
};

type Props = {
  matches: FinderDiscoveryMatch[];
  meta: FinderDiscoveryMeta | null;
};

export function FinderDiscoveryMatches({ matches, meta }: Props) {
  if (!meta) return null;
  const providers = matches.filter((item) => item.kind === "provider");
  const workers = matches.filter((item) => item.kind === "worker");
  return (
    <section aria-label="Search matches and evidence" className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Search results</h3>
        <span className="text-xs text-muted-foreground">
          {meta.personalised ? "Using your saved preferences" : "Based on this search only"}
        </span>
      </div>
      <p role="status" aria-live="polite" className="text-sm">
        {providers.length} provider listing{providers.length === 1 ? "" : "s"} and {workers.length} opted-in worker profile{workers.length === 1 ? "" : "s"} shown.
      </p>
      <ul className="space-y-3" aria-label="Matching providers and workers">
        {matches.map((match) => (
          <li key={match.kind + ":" + match.id} className="rounded-md border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {match.kind === "worker" ? "Worker profile · self-published" : "Provider · directory import"}
            </p>
            <p className="mt-1 font-semibold">{match.name}</p>
            <p className="text-sm">{match.location}</p>
            {match.services.length > 0 ? (
              <p className="mt-1 text-sm">Listed services: {match.services.join(", ")}</p>
            ) : null}
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground" aria-label="Why this result appeared">
              {match.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Source: {match.source}. {match.caution}
            </p>
          </li>
        ))}
      </ul>
      {meta.scope !== "providers" ? (
        <p className="text-xs text-muted-foreground">{meta.workerNotice}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Results are not a recommendation or regulatory approval. Confirm provider registration
        and worker screening through the appropriate official channels.
      </p>
    </section>
  );
}
