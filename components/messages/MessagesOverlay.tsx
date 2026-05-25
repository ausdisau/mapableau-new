"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatActionsPanel } from "@/components/messages/ChatActionsPanel";
import { ChatInfoPanel } from "@/components/messages/ChatInfoPanel";
import { CreateGroupChatCard } from "@/components/messages/CreateGroupChatCard";
import { InboxThreadItem } from "@/components/messages/InboxThreadItem";
import { ConferenceCallPanel } from "@/components/messages/ConferenceCallPanel";
import { MessageThread } from "@/components/messages/MessageThread";
import { NestedTabPanels } from "@/components/messages/NestedTabPanels";
import {
  filterInboxThreads,
  type LinkedInboxSubTab,
  type PrimaryInboxTab,
} from "@/lib/messages/inbox-filters";
import type { ConversationThread, Message, ThreadContextLinks } from "@/types/messages";

type PrimaryTab = PrimaryInboxTab;
type LinkedSubTab = LinkedInboxSubTab;
type ThreadPanelTab = "chat" | "call" | "details" | "actions";
type CallSubTab = "audio" | "video";

const PRIMARY_TABS = [
  { id: "all" as const, label: "All" },
  { id: "direct" as const, label: "Direct" },
  { id: "groups" as const, label: "Groups" },
  { id: "linked" as const, label: "Linked" },
  { id: "safety" as const, label: "Safety" },
];

const LINKED_SUB_TABS = [
  { id: "all_linked" as const, label: "All linked" },
  { id: "booking" as const, label: "Bookings" },
  { id: "transport" as const, label: "Transport" },
  { id: "invoice" as const, label: "Invoices" },
  { id: "support" as const, label: "Support" },
];

const THREAD_TABS = [
  { id: "chat" as const, label: "Chat" },
  { id: "call" as const, label: "Call" },
  { id: "details" as const, label: "Details" },
  { id: "actions" as const, label: "Actions" },
];

const CALL_SUB_TABS = [
  { id: "audio" as const, label: "Audio" },
  { id: "video" as const, label: "Video" },
];

export function MessagesOverlay({
  open,
  onClose,
  currentProfileId,
  canEscalateSafety = false,
  showCreateGroup = true,
}: {
  open: boolean;
  onClose: () => void;
  currentProfileId: string;
  canEscalateSafety?: boolean;
  showCreateGroup?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [inbox, setInbox] = useState<ConversationThread[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxError, setInboxError] = useState("");

  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("all");
  const [linkedSubTab, setLinkedSubTab] = useState<LinkedSubTab>("all_linked");
  const [threadPanelTab, setThreadPanelTab] = useState<ThreadPanelTab>("chat");
  const [callSubTab, setCallSubTab] = useState<CallSubTab>("audio");

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<{
    thread: ConversationThread;
    messages: Message[];
    context: ThreadContextLinks;
    participants: {
      profileId: string;
      displayName: string;
      role: string;
      profileHref: string;
    }[];
  } | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);

  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    setInboxError("");
    try {
      const res = await fetch("/api/messages/inbox");
      if (!res.ok) {
        setInboxError("Could not load your inbox.");
        return;
      }
      const data = await res.json();
      setInbox(data.inbox ?? []);
    } catch {
      setInboxError("Could not load your inbox.");
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  const loadThread = useCallback(async (threadId: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/messages/threads/${threadId}`);
      if (!res.ok) {
        setThreadDetail(null);
        return;
      }
      const data = await res.json();
      setThreadDetail({
        thread: data.thread,
        messages: data.messages ?? [],
        context: data.context ?? {},
        participants: data.participants ?? [],
      });
      await fetch(`/api/messages/threads/${threadId}/read`, { method: "POST" });
    } catch {
      setThreadDetail(null);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadInbox();
      closeRef.current?.focus();
    } else {
      setActiveThreadId(null);
      setThreadDetail(null);
      setPrimaryTab("all");
      setLinkedSubTab("all_linked");
      setThreadPanelTab("chat");
      setCallSubTab("audio");
    }
  }, [open, loadInbox]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (activeThreadId) {
      loadThread(activeThreadId);
      setThreadPanelTab("chat");
    } else {
      setThreadDetail(null);
    }
  }, [activeThreadId, loadThread]);

  const filteredInbox = useMemo(
    () => filterInboxThreads(inbox, primaryTab, linkedSubTab),
    [inbox, primaryTab, linkedSubTab]
  );

  const tabBadges = useMemo(() => {
    const counts: Record<PrimaryTab, number> = {
      all: inbox.length,
      direct: filterInboxThreads(inbox, "direct", "all_linked").length,
      groups: filterInboxThreads(inbox, "groups", "all_linked").length,
      linked: filterInboxThreads(inbox, "linked", "all_linked").length,
      safety: filterInboxThreads(inbox, "safety", "all_linked").length,
    };
    return counts;
  }, [inbox]);

  const participantNames = Object.fromEntries(
    (threadDetail?.participants ?? []).map((p) => [p.profileId, p.displayName])
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:h-[min(85dvh,820px)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" aria-hidden />
            <h2 id={titleId} className="font-heading text-lg font-bold">
              Messages
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {activeThreadId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={() => setActiveThreadId(null)}
              >
                Back to inbox
              </Button>
            ) : null}
            <Button
              ref={closeRef}
              type="button"
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11"
              onClick={onClose}
              aria-label="Close messages"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {!activeThreadId ? (
          <NestedTabPanels
            ariaLabel="Message categories"
            nestedAriaLabel="Linked message types"
            tabs={PRIMARY_TABS.map((t) => ({
              id: t.id,
              label: t.label,
              badge: tabBadges[t.id],
            }))}
            activeId={primaryTab}
            onChange={(id) => {
              setPrimaryTab(id as PrimaryTab);
              if (id !== "linked") setLinkedSubTab("all_linked");
            }}
            nestedTabs={
              primaryTab === "linked"
                ? LINKED_SUB_TABS.map((t) => ({ id: t.id, label: t.label }))
                : undefined
            }
            nestedActiveId={primaryTab === "linked" ? linkedSubTab : undefined}
            onNestedChange={
              primaryTab === "linked"
                ? (id) => setLinkedSubTab(id as LinkedSubTab)
                : undefined
            }
          />
        ) : (
          <NestedTabPanels
            ariaLabel="Conversation sections"
            tabs={THREAD_TABS.map((t) => ({ id: t.id, label: t.label }))}
            activeId={threadPanelTab}
            onChange={(id) => {
              setThreadPanelTab(id as ThreadPanelTab);
              if (id !== "call") setCallSubTab("audio");
            }}
            nestedTabs={
              threadPanelTab === "call"
                ? CALL_SUB_TABS.map((t) => ({ id: t.id, label: t.label }))
                : undefined
            }
            nestedActiveId={threadPanelTab === "call" ? callSubTab : undefined}
            onNestedChange={
              threadPanelTab === "call"
                ? (id) => setCallSubTab(id as CallSubTab)
                : undefined
            }
            nestedAriaLabel="Call type"
          />
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          {!activeThreadId ? (
            <div
              role="tabpanel"
              id={`tabpanel-${primaryTab}`}
              aria-labelledby={`tab-${primaryTab}`}
              className="flex h-full flex-col"
            >
              {showCreateGroup && primaryTab !== "safety" ? (
                <div className="border-b border-border p-4">
                  <CreateGroupChatCard basePath="/messages" />
                </div>
              ) : null}
              <div className="flex-1 overflow-y-auto p-2">
                {loadingInbox ? (
                  <p className="px-4 py-8 text-sm text-muted-foreground">Loading inbox…</p>
                ) : inboxError ? (
                  <p className="px-4 py-8 text-sm text-destructive" role="alert">
                    {inboxError}
                  </p>
                ) : (
                  <ul className="space-y-2" role="list">
                    {filteredInbox.map((thread) => (
                      <li key={thread.id}>
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => setActiveThreadId(thread.id)}
                        >
                          <InboxThreadItem
                            thread={thread}
                            href="#"
                            isActive={false}
                            asStatic
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!loadingInbox && !inboxError && !filteredInbox.length ? (
                  <p className="px-4 py-8 text-sm text-muted-foreground">
                    No conversations in this tab yet.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div
              role="tabpanel"
              id={`tabpanel-${threadPanelTab}`}
              aria-labelledby={`tab-${threadPanelTab}`}
              className="h-full overflow-y-auto"
            >
              {loadingThread ? (
                <p className="p-8 text-sm text-muted-foreground">Loading conversation…</p>
              ) : !threadDetail ? (
                <p className="p-8 text-sm text-destructive" role="alert">
                  This conversation could not be loaded.
                </p>
              ) : threadPanelTab === "chat" ? (
                <div className="flex h-full min-h-[360px] flex-col">
                  <div className="border-b border-border px-4 py-2">
                    <p className="font-medium">{threadDetail.thread.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {threadDetail.thread.threadType.replace(/_/g, " ")}
                    </p>
                  </div>
                  <MessageThread
                    threadId={activeThreadId}
                    initialMessages={threadDetail.messages}
                    currentUserId={currentProfileId}
                    participantNames={participantNames}
                    showAacBar
                  />
                </div>
              ) : threadPanelTab === "call" ? (
                <div className="flex h-full min-h-[360px] flex-col">
                  <div className="border-b border-border px-4 py-2">
                    <p className="font-medium">{threadDetail.thread.title}</p>
                    <p className="text-xs text-muted-foreground">Call — {callSubTab}</p>
                  </div>
                  <ConferenceCallPanel threadId={activeThreadId} mode={callSubTab} />
                </div>
              ) : threadPanelTab === "details" ? (
                <ChatInfoPanel
                  threadId={activeThreadId}
                  participants={threadDetail.participants}
                  context={threadDetail.context}
                  currentProfileId={currentProfileId}
                  canEscalateSafety={canEscalateSafety}
                />
              ) : (
                <div className="p-4">
                  <ChatActionsPanel
                    threadId={activeThreadId}
                    otherProfileId={
                      threadDetail.participants.find(
                        (p) => p.profileId !== currentProfileId
                      )?.profileId
                    }
                    canEscalateSafety={canEscalateSafety}
                  />
                  <p className="mt-4 text-xs text-muted-foreground">
                    For the full three-panel layout, open{" "}
                    <a href="/messages" className="font-medium text-primary underline">
                      Communication Centre
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
          <span aria-live="polite">
            {activeThreadId
              ? `Viewing: ${threadDetail?.thread.title ?? "conversation"}`
              : `${filteredInbox.length} conversation${filteredInbox.length === 1 ? "" : "s"} in this tab`}
          </span>
        </footer>
      </div>
    </div>
  );
}
