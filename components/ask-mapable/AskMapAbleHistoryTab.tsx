"use client";

import type { AskLocalSession } from "./types";

type Props = {
  sessions: AskLocalSession[];
  onOpen: (sessionId: string) => void;
  onNew: () => void;
};

export function AskMapAbleHistoryTab({ sessions, onOpen, onNew }: Props) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        className="min-h-11 w-full rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onNew}
      >
        New conversation
      </button>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No conversations yet. Chat history for this browser tab is stored
          locally and is not a second server memory store.
        </p>
      ) : (
        <ul className="grid gap-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(s.id)}
              >
                <span className="block font-medium">{s.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.updatedAt).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
