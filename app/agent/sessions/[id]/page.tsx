"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AgentMessageList } from "@/components/mapable-agent/AgentMessageList";
import type { AgentMessage } from "@/components/mapable-agent/AgentComposer";

export default function AgentSessionPage() {
  const params = useParams();
  const id = params.id as string;
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [title, setTitle] = useState("Session");

  useEffect(() => {
    void fetch(`/api/mapable-agent/sessions/${id}`)
      .then((r) => r.json())
      .then((data: { session?: { title?: string; messages?: AgentMessage[] } }) => {
        if (data.session) {
          setTitle(data.session.title ?? "Session");
          setMessages(
            (data.session.messages ?? []).map((m, i) => ({
              id: `loaded-${i}`,
              role: m.role === "user" ? "user" : "assistant",
              content: typeof m.content === "string" ? m.content : "",
              reasoningSummary: m.reasoningSummary,
            })),
          );
        }
      });
  }, [id]);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="mt-6">
        <AgentMessageList messages={messages} />
      </div>
    </>
  );
}
