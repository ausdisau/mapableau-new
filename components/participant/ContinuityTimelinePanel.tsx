"use client";

import { useEffect, useState } from "react";

type TimelineEntry = {
  id: string;
  occurredAt: string;
  category: string;
  title: string;
  detail?: string;
};

export function ContinuityTimelinePanel({ className }: { className?: string }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/participant/continuity-timeline")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load timeline");
        return res.json() as Promise<{ timeline: TimelineEntry[] }>;
      })
      .then((data) => setEntries(data.timeline))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your continuity timeline will appear here as bookings, care, and transport
        events are orchestrated.
      </p>
    );
  }

  return (
    <ol className={className} aria-label="Continuity timeline">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="relative border-l-2 border-border pb-4 pl-4 last:pb-0"
        >
          <time className="text-xs text-muted-foreground">
            {new Date(entry.occurredAt).toLocaleString()}
          </time>
          <p className="font-medium">{entry.title}</p>
          {entry.detail ? (
            <p className="text-sm text-muted-foreground">{entry.detail}</p>
          ) : null}
          <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs capitalize">
            {entry.category}
          </span>
        </li>
      ))}
    </ol>
  );
}
