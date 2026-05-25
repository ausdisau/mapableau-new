"use client";

import { InboxThreadItem } from "@/components/messages/InboxThreadItem";
import { CreateGroupChatCard } from "@/components/messages/CreateGroupChatCard";
import type { ConversationThread } from "@/types/messages";

export function InboxPanel({
  threads,
  basePath,
  activeThreadId,
  showCreateGroup,
}: {
  threads: ConversationThread[];
  basePath: string;
  activeThreadId?: string;
  showCreateGroup?: boolean;
}) {
  return (
    <aside
      className="flex h-full flex-col border-r border-border bg-card"
      aria-label="Message inbox"
    >
      <header className="border-b border-border px-4 py-4">
        <h2 className="font-heading text-lg font-bold">Inbox</h2>
        <p className="text-sm text-muted-foreground">
          Direct messages, groups, and linked booking or support threads.
        </p>
      </header>
      {showCreateGroup ? (
        <div className="border-b border-border p-4">
          <CreateGroupChatCard basePath={basePath} />
        </div>
      ) : null}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-2" role="list">
          {threads.map((thread) => (
            <InboxThreadItem
              key={thread.id}
              thread={thread}
              href={`${basePath}/${thread.id}`}
              isActive={thread.id === activeThreadId}
            />
          ))}
        </ul>
        {!threads.length ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">No conversations yet.</p>
        ) : null}
      </nav>
    </aside>
  );
}
