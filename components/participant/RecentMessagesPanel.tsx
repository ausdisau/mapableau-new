import React from "react";
import Link from "next/link";

import type { ParticipantMessagePreview } from "@/types/participant-dashboard";

type RecentMessagesPanelProps = {
  messages: ParticipantMessagePreview[];
};

export function RecentMessagesPanel({ messages }: RecentMessagesPanelProps) {
  return (
    <section aria-labelledby="messages-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="messages-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Recent messages
        </h2>
        <Link
          href="/dashboard/messages"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          All messages
        </Link>
      </div>
      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Secure messages appear here when you contact a provider about a
          booking. Your personal health notes are not shown in message previews.
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/dashboard/messages/${thread.conversationId}`}
                className="block rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="text-sm font-semibold text-foreground">
                  {thread.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {thread.preview}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
