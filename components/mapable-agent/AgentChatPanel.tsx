"use client";

import { useCallback, useState } from "react";

import {
  AgentComposer,
  useAgentMessages,
} from "@/components/mapable-agent/AgentComposer";
import { AgentMessageList } from "@/components/mapable-agent/AgentMessageList";
import { ConsentGateCard } from "@/components/mapable-agent/ConsentGateCard";
import { HumanReviewBadge } from "@/components/mapable-agent/HumanReviewBadge";

type AgentChatPanelProps = {
  sessionId?: string;
  showReasoning?: boolean;
  largeTargets?: boolean;
};

export function AgentChatPanel({
  sessionId: initialSessionId,
  showReasoning = false,
  largeTargets = false,
}: AgentChatPanelProps) {
  const { messages, append } = useAgentMessages();
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [pendingReview, setPendingReview] = useState(false);
  const [confirmations, setConfirmations] = useState<
    Array<{ title: string; explanation: string }>
  >([]);

  const send = useCallback(
    async (message: string) => {
      append({ role: "user", content: message });

      const res = await fetch("/api/mapable-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Request failed");
      }

      const data = (await res.json()) as {
        sessionId: string;
        text: string;
        reasoningSummary?: string;
        humanReviewRequired?: boolean;
        requiredConfirmations?: Array<{
          title: string;
          explanation: string;
        }>;
      };

      setSessionId(data.sessionId);
      append({
        role: "assistant",
        content: data.text,
        reasoningSummary: data.reasoningSummary,
      });
      setPendingReview(Boolean(data.humanReviewRequired));
      setConfirmations(data.requiredConfirmations ?? []);
    },
    [append, sessionId],
  );

  return (
    <div className="space-y-6">
      {pendingReview ? <HumanReviewBadge /> : null}
      {confirmations.map((c) => (
        <ConsentGateCard key={c.title} title={c.title} explanation={c.explanation} />
      ))}
      <AgentMessageList
        messages={messages}
        showReasoning={showReasoning}
        largeTargets={largeTargets}
      />
      <AgentComposer onSend={send} />
      <p role="status" className="text-sm text-slate-600">
        Nothing is booked, sent, or shared until you confirm with a staff member.
      </p>
    </div>
  );
}
