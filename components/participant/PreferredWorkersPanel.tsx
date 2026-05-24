import React from "react";

import type { ParticipantPreferredWorkerItem } from "@/types/participant-dashboard";

type PreferredWorkersPanelProps = {
  workers: ParticipantPreferredWorkerItem[];
};

export function PreferredWorkersPanel({ workers }: PreferredWorkersPanelProps) {
  return (
    <section aria-labelledby="workers-heading" className="space-y-3">
      <h2
        id="workers-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Preferred workers
      </h2>
      {workers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          When you work with support workers you like, they can appear here.
          You can also add preferred workers from your profile settings later.
        </p>
      ) : (
        <ul className="space-y-2">
          {workers.map((worker) => (
            <li
              key={worker.id}
              className="rounded-xl border border-border/60 bg-card px-4 py-3"
            >
              <p className="text-sm font-medium text-foreground">{worker.name}</p>
              {worker.label ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {worker.label}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
