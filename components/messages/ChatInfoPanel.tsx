"use client";

import { ChatActionsPanel } from "@/components/messages/ChatActionsPanel";
import { ChatParticipantCard } from "@/components/messages/ChatParticipantCard";
import { ThreadContextCards } from "@/components/messages/ThreadContextCards";
import type { ThreadContextLinks } from "@/types/messages";

export function ChatInfoPanel({
  threadId,
  participants,
  context,
  currentProfileId,
  canEscalateSafety,
  onClose,
}: {
  threadId: string;
  participants: {
    profileId: string;
    displayName: string;
    role: string;
    profileHref: string;
  }[];
  context: ThreadContextLinks;
  currentProfileId: string;
  canEscalateSafety?: boolean;
  onClose?: () => void;
}) {
  const others = participants.filter((p) => p.profileId !== currentProfileId);

  return (
    <aside
      className="flex h-full flex-col border-l border-border bg-card"
      aria-label="Chat information"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
        <h2 className="font-heading text-lg font-bold">Chat info</h2>
        {onClose ? (
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-lg border border-border px-3 text-sm lg:hidden"
            onClick={onClose}
          >
            Close
          </button>
        ) : null}
      </header>
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <section aria-label="Participants">
          <h3 className="mb-2 text-sm font-semibold">People in this chat</h3>
          <div className="space-y-2">
            {others.map((p) => (
              <ChatParticipantCard
                key={p.profileId}
                displayName={p.displayName}
                role={p.role}
                profileHref={p.profileHref}
              />
            ))}
          </div>
        </section>
        <ThreadContextCards context={context} />
        <ChatActionsPanel
          threadId={threadId}
          otherProfileId={others[0]?.profileId}
          canEscalateSafety={canEscalateSafety}
        />
      </div>
    </aside>
  );
}
