"use client";

import { useEffect, useState } from "react";

import { listDrafts, discardDraft, type QueuedDraft } from "@/lib/offline/offline-queue-service";
import { SyncStatusBadge } from "@/components/offline/SyncStatusBadge";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

export function OfflineActionQueue() {
  const { online } = useNetworkStatus();
  const [drafts, setDrafts] = useState<QueuedDraft[]>([]);

  const load = async () => {
    try {
      setDrafts(await listDrafts());
    } catch {
      setDrafts([]);
    }
  };

  useEffect(() => {
    void load();
  }, [online]);

  if (drafts.length === 0) return null;

  return (
    <section
      aria-labelledby="offline-queue-heading"
      className="rounded-xl border border-border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="offline-queue-heading" className="font-semibold">
          Unsent drafts
        </h2>
        <SyncStatusBadge online={online} pendingCount={drafts.length} />
      </div>
      <ul className="mt-3 space-y-2">
        {drafts.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>
              <span className="font-medium">{d.type.replace(/_/g, " ")}</span>
              <span className="block text-muted-foreground">
                Saved on this device
              </span>
            </span>
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-sm"
              onClick={() => {
                void discardDraft(d.id).then(load);
              }}
            >
              Discard
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
