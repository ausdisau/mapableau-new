"use client";

import { usePathname } from "next/navigation";

import { MobileInboxView } from "@/components/messages/MobileInboxView";
import { MobileThreadView } from "@/components/messages/MobileThreadView";

export type ConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string | null;
};

export function CommunicationCentreShell({
  conversations,
  activeThreadId,
  threadTitle,
}: {
  conversations: ConversationSummary[];
  activeThreadId?: string;
  threadTitle?: string;
}) {
  const pathname = usePathname();
  const onThread = Boolean(
    activeThreadId || pathname.match(/\/messages\/[^/]+$/)
  );

  return (
    <div className="flex min-h-[60vh] flex-col md:min-h-0">
      <div className={onThread ? "hidden md:block" : "block md:block"}>
        {!onThread ? (
          <MobileInboxView conversations={conversations} />
        ) : (
          <div className="hidden md:block">
            <MobileInboxView conversations={conversations} />
          </div>
        )}
      </div>
      {onThread && activeThreadId ? (
        <MobileThreadView
          conversationId={activeThreadId}
          title={threadTitle ?? "Conversation"}
          backHref="/dashboard/messages"
        />
      ) : null}
    </div>
  );
}
