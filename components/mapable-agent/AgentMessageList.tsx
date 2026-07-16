"use client";

import type { AgentMessage } from "@/components/mapable-agent/AgentComposer";
import { ReasoningSummaryCollapsible } from "@/components/mapable-agent/ReasoningSummaryCollapsible";

type AgentMessageListProps = {
  messages: AgentMessage[];
  showReasoning?: boolean;
  largeTargets?: boolean;
};

export function AgentMessageList({
  messages,
  showReasoning = false,
  largeTargets = false,
}: AgentMessageListProps) {
  return (
    <ul
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className={`space-y-4 ${largeTargets ? "text-lg" : "text-base"}`}
    >
      {messages.map((msg) => (
        <li
          key={msg.id}
          className={
            msg.role === "user"
              ? "ml-auto max-w-[85%] rounded-2xl bg-[#005B7F]/10 px-4 py-3"
              : "mr-auto max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3"
          }
        >
          <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{msg.content}</p>
          {showReasoning && msg.reasoningSummary ? (
            <ReasoningSummaryCollapsible summary={msg.reasoningSummary} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
