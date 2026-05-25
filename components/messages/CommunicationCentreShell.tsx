"use client";

import { useState } from "react";

import { ChatInfoPanel } from "@/components/messages/ChatInfoPanel";
import { InboxPanel } from "@/components/messages/InboxPanel";
import { MessageThread } from "@/components/messages/MessageThread";
import type { ConversationThread, Message, ThreadContextLinks } from "@/types/messages";

type MobilePanel = "inbox" | "thread" | "info";

export function CommunicationCentreShell({
  basePath,
  inbox,
  activeThreadId,
  threadDetail,
  currentProfileId,
  showCreateGroup,
  canEscalateSafety,
}: {
  basePath: string;
  inbox: ConversationThread[];
  activeThreadId?: string;
  threadDetail?: {
    thread: ConversationThread;
    messages: Message[];
    context: ThreadContextLinks;
    participants: {
      profileId: string;
      displayName: string;
      role: string;
      profileHref: string;
    }[];
  } | null;
  currentProfileId: string;
  showCreateGroup?: boolean;
  canEscalateSafety?: boolean;
}) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(
    activeThreadId ? "thread" : "inbox"
  );
  const [infoOpen, setInfoOpen] = useState(false);

  const participantNames = Object.fromEntries(
    (threadDetail?.participants ?? []).map((p) => [p.profileId, p.displayName])
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[480px] flex-col rounded-xl border border-border bg-background shadow-sm lg:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <h1 className="font-heading text-lg font-bold">Messages</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className={`min-h-11 rounded-lg px-3 text-sm ${mobilePanel === "inbox" ? "bg-primary text-primary-foreground" : "border border-border"}`}
            onClick={() => setMobilePanel("inbox")}
          >
            Inbox
          </button>
          {activeThreadId ? (
            <>
              <button
                type="button"
                className={`min-h-11 rounded-lg px-3 text-sm ${mobilePanel === "thread" ? "bg-primary text-primary-foreground" : "border border-border"}`}
                onClick={() => setMobilePanel("thread")}
              >
                Thread
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-lg px-3 text-sm ${mobilePanel === "info" ? "bg-primary text-primary-foreground" : "border border-border"}`}
                onClick={() => setMobilePanel("info")}
              >
                Info
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(240px,280px)_1fr_minmax(240px,300px)]">
        <div
          className={`min-h-0 ${
            mobilePanel === "inbox" ? "flex" : "hidden"
          } lg:flex`}
        >
          <InboxPanel
            threads={inbox}
            basePath={basePath}
            activeThreadId={activeThreadId}
            showCreateGroup={showCreateGroup}
          />
        </div>

        <div
          className={`min-h-0 border-border lg:border-x ${
            mobilePanel === "thread" ? "flex" : "hidden"
          } ${activeThreadId ? "lg:flex" : "lg:flex"}`}
        >
          {threadDetail && activeThreadId ? (
            <MessageThread
              threadId={activeThreadId}
              initialMessages={threadDetail.messages}
              currentUserId={currentProfileId}
              participantNames={participantNames}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
              <p>Select a conversation from your inbox.</p>
            </div>
          )}
        </div>

        <div
          className={`min-h-0 ${
            mobilePanel === "info" || infoOpen ? "flex" : "hidden"
          } lg:flex`}
        >
          {threadDetail && activeThreadId ? (
            <ChatInfoPanel
              threadId={activeThreadId}
              participants={threadDetail.participants}
              context={threadDetail.context}
              currentProfileId={currentProfileId}
              canEscalateSafety={canEscalateSafety}
              onClose={() => setMobilePanel("thread")}
            />
          ) : (
            <div className="hidden flex-1 items-center justify-center p-6 text-sm text-muted-foreground lg:flex">
              Chat details appear when you open a thread.
            </div>
          )}
        </div>
      </div>

      {threadDetail && activeThreadId ? (
        <div className="hidden border-t border-border px-4 py-2 lg:block xl:hidden">
          <button
            type="button"
            className="min-h-11 text-sm font-medium underline"
            onClick={() => setInfoOpen((v) => !v)}
          >
            {infoOpen ? "Hide chat info" : "Show chat info"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
