"use client";

import { useCallback, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoningSummary?: string;
};

type AgentComposerProps = {
  disabled?: boolean;
  onSend: (message: string) => Promise<void>;
};

export function AgentComposer({ disabled, onSend }: AgentComposerProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const text = value.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text);
      setValue("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }, [onSend, sending, value]);

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="sr-only">
        Message MapAble Agent
      </label>
      <div className="flex gap-2">
        <textarea
          id={inputId}
          rows={3}
          value={value}
          disabled={disabled || sending}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          placeholder="Ask in plain language…"
          aria-describedby={error ? errorId : undefined}
        />
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={() => void submit()}
          disabled={disabled || sending || !value.trim()}
          className="min-h-11 min-w-11 touch-manipulation self-end"
          aria-busy={sending}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Send className="h-5 w-5" aria-hidden />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function useAgentMessages() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const counter = useRef(0);

  const append = useCallback((msg: Omit<AgentMessage, "id">) => {
    counter.current += 1;
    setMessages((prev) => [...prev, { ...msg, id: `msg-${counter.current}` }]);
  }, []);

  return { messages, append };
}
