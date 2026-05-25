"use client";

import Link from "next/link";

import type { ConversationSummary } from "@/components/messages/CommunicationCentreShell";

export function MobileInboxView({
  conversations,
  basePath = "/dashboard/messages",
}: {
  conversations: ConversationSummary[];
  basePath?: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold md:text-2xl">
        Messages
      </h1>
      <p className="text-sm text-muted-foreground">
        Only people in each conversation can read messages.
      </p>
      {conversations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No conversations yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`${basePath}/${c.id}`}
                className="flex min-h-[4.5rem] flex-col justify-center px-4 py-3 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="font-medium">{c.title}</span>
                {c.lastMessageAt ? (
                  <span className="text-sm text-muted-foreground">
                    Last activity:{" "}
                    {new Date(c.lastMessageAt).toLocaleString("en-AU")}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No messages yet
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
