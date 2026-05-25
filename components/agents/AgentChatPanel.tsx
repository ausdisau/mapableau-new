"use client";

import { useCallback, useId, useState } from "react";

import { AgentApprovalPrompt } from "./AgentApprovalPrompt";
import { AgentMessageList, type ChatMessage } from "./AgentMessageList";
import { AgentSafetyNotice } from "./AgentSafetyNotice";
import { AgentToolCallCard } from "./AgentToolCallCard";

type AgentApiResult = {
  agentId?: string;
  response: string;
  actionStatus?: string;
  requiresHumanConfirmation?: boolean;
  toolCalls?: Array<{ toolName: string; status: string; riskLevel?: string }>;
};

export function AgentChatPanel() {
  const inputId = useId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AgentApiResult | null>(null);
  const [useStream, setUseStream] = useState(false);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      if (useStream) {
        const res = await fetch("/api/agents/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Stream request failed");
        }
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        let result: AgentApiResult | null = null;

        const assistantId = `a-${Date.now()}`;
        setMessages((m) => [
          ...m,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.trim()) continue;
              const event = JSON.parse(line) as {
                type: string;
                delta?: string;
                result?: AgentApiResult;
                message?: string;
              };
              if (event.type === "text" && event.delta) {
                assistantText += event.delta;
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: assistantText }
                      : msg
                  )
                );
              }
              if (event.type === "done" && event.result) {
                result = event.result;
              }
            }
          }
        }

        if (result) {
          setLastResult(result);
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: result!.response || assistantText,
                    actionStatus: result!.actionStatus,
                    requiresHumanConfirmation: result!.requiresHumanConfirmation,
                    toolCalls: result!.toolCalls,
                  }
                : msg
            )
          );
        }
      } else {
        const res = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = (await res.json()) as AgentApiResult & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Request failed");

        setLastResult(data);
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.response,
            actionStatus: data.actionStatus,
            requiresHumanConfirmation: data.requiresHumanConfirmation,
            toolCalls: data.toolCalls,
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, loading, useStream]);

  return (
    <div className="flex h-full min-h-[480px] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useStream}
            onChange={(e) => setUseStream(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Stream responses
        </label>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-background p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask about bookings, invoices, providers, consent, or support. MapAble
            assistants explain and draft — they do not approve payments or make clinical
            decisions.
          </p>
        ) : (
          <AgentMessageList messages={messages} />
        )}
      </div>

      {lastResult?.actionStatus ? (
        <AgentSafetyNotice
          actionStatus={lastResult.actionStatus}
          requiresHumanConfirmation={lastResult.requiresHumanConfirmation}
        />
      ) : null}

      {lastResult?.requiresHumanConfirmation ? <AgentApprovalPrompt /> : null}

      {lastResult?.toolCalls?.length ? (
        <AgentToolCallCard toolCalls={lastResult.toolCalls} />
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.includes("AGENTS_DISABLED") || error.includes("not enabled")
            ? "MapAble assistants are not enabled. Set AGENTS_ENABLED=true for this environment."
            : error}
        </p>
      ) : null}

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Message to assistant
        </label>
        <textarea
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="min-h-11 flex-1 resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Type your question…"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-11 shrink-0 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}
