"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { MessageDateDivider } from "@/components/messages/MessageDateDivider";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { AttachmentPicker } from "@/components/messages/AttachmentPicker";
import { useMessageRealtime } from "@/hooks/useMessageRealtime";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useAacPreferences } from "@/hooks/useAacPreferences";
import type { Message } from "@/types/messages";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function MessageThread({
  threadId,
  initialMessages,
  currentUserId,
  participantNames,
  showAacBar: showAacBarProp,
}: {
  threadId: string;
  initialMessages: Message[];
  currentUserId: string;
  participantNames: Record<string, string>;
  showAacBar?: boolean;
}) {
  const { phrases, showAacByDefault } = useAacPreferences();
  const showAacBar = showAacBarProp ?? showAacByDefault;

  const [messages, setMessages] = useState(initialMessages);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/messages/threads/${threadId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [threadId]);

  const { appendMessage } = useMessageRealtime(threadId, refetch);
  const { typingProfileIds, notifyTyping } = useTypingIndicator(threadId, currentUserId);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const typingNames = typingProfileIds.map((id) => participantNames[id] ?? "Someone");

  const grouped: { date: string; items: Message[] }[] = [];
  for (const m of messages) {
    const d = dateLabel(m.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.date === d) last.items.push(m);
    else grouped.push({ date: d, items: [m] });
  }

  return (
    <section className="flex h-full flex-col" aria-label="Message thread">
      <div className="flex items-center justify-end border-b border-border px-4 py-2">
        <a
          href="#thread-latest"
          className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip to latest message
        </a>
      </div>
      <div
        ref={logRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Messages"
        tabIndex={0}
      >
        {grouped.map((g) => (
          <div key={g.date}>
            <MessageDateDivider label={g.date} />
            {g.items.map((m) => (
              <MessageBubble
                key={m.id}
                body={m.deletedAt ? "Message removed" : m.body}
                senderName={m.senderDisplayName ?? participantNames[m.senderProfileId] ?? "Member"}
                createdAt={m.createdAt}
                isOwn={m.senderProfileId === currentUserId}
                status={m.status}
              />
            ))}
          </div>
        ))}
        <div id="thread-latest" tabIndex={-1} />
      </div>
      <TypingIndicator names={typingNames} />
      {liveStatus ? (
        <p className="px-4 text-sm text-destructive" role="alert">
          {liveStatus}
        </p>
      ) : null}
      <div className="border-t border-border p-4">
        <AttachmentPicker documentIds={attachmentIds} onChange={setAttachmentIds} />
        <MessageComposer
          threadId={threadId}
          showAacBar={showAacBar}
          aacPhrases={phrases}
          attachmentDocumentIds={attachmentIds}
          onTyping={notifyTyping}
          onSend={async (body, attachments) => {
            setLiveStatus("");
            const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                body,
                attachmentDocumentIds: attachments,
              }),
            });
            if (!res.ok) {
              setLiveStatus("Could not send your message. Try again.");
              throw new Error("send failed");
            }
            const data = await res.json();
            const message = data.message as Message;
            appendMessage(message);
            setMessages((prev) => [...prev, message]);
            setAttachmentIds([]);
            await fetch(`/api/messages/threads/${threadId}/read`, { method: "POST" });
          }}
        />
      </div>
    </section>
  );
}
