"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ASK_MAPABLE_EMPTY_STATE,
  ASK_MAPABLE_PENDING,
  ASK_MAPABLE_SAFE_FAILURE,
  resolveMapAbleModule,
  startersForPageContext,
} from "@/lib/ask-mapable";
import type { CopilotAskResponse } from "@/lib/copilot/types";

import type { AskChatMessage } from "./types";

type Props = {
  sessionId: string | null;
  onEnsureSession: (title?: string) => string;
  messages: AskChatMessage[];
  onAppend: (sessionId: string, messages: AskChatMessage[], title?: string) => void;
  seedMessage?: string | null;
  onSeedConsumed?: () => void;
};

export function AskMapAbleChatTab({
  sessionId,
  onEnsureSession,
  messages,
  onAppend,
  seedMessage,
  onSeedConsumed,
}: Props) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pageContext = useMemo(
    () => ({
      pathname,
      mapableModule: resolveMapAbleModule(pathname),
    }),
    [pathname],
  );
  const starters = useMemo(
    () => startersForPageContext(pageContext),
    [pageContext],
  );

  useEffect(() => {
    if (seedMessage) {
      setInput(seedMessage);
      onSeedConsumed?.();
      inputRef.current?.focus();
    }
  }, [seedMessage, onSeedConsumed]);

  useEffect(() => {
    const el = logRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight });
    } else if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, pending]);

  const send = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || pending) return;

      const sid = sessionId ?? onEnsureSession(query);
      const userMsg: AskChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: query,
        createdAt: new Date().toISOString(),
      };
      onAppend(sid, [userMsg], query);
      setInput("");
      setPending(true);
      setStatus(ASK_MAPABLE_PENDING);
      setError(null);

      try {
        const history = [...messages, userMsg]
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/mapable/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            query,
            mode: "All",
            sessionId: sid,
            messages: history,
            pageContext,
          }),
        });

        const data = (await res.json()) as CopilotAskResponse & {
          error?: string;
        };

        if (!res.ok) {
          const msg =
            data.error ||
            (res.status === 401
              ? "Sign in to use Ask MapAble."
              : ASK_MAPABLE_SAFE_FAILURE);
          setError(msg);
          onAppend(sid, [
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: msg,
              createdAt: new Date().toISOString(),
            },
          ]);
          return;
        }

        const answer =
          data.answer ||
          data.summary ||
          ASK_MAPABLE_SAFE_FAILURE;
        onAppend(sid, [
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: answer,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch {
        setError(ASK_MAPABLE_SAFE_FAILURE);
        onAppend(sid, [
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: ASK_MAPABLE_SAFE_FAILURE,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setPending(false);
        setStatus(null);
      }
    },
    [
      messages,
      onAppend,
      onEnsureSession,
      pageContext,
      pending,
      sessionId,
    ],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      {messages.length === 0 ? (
        <div className="space-y-3">
          <p className="font-medium">{ASK_MAPABLE_EMPTY_STATE.title}</p>
          <p className="text-sm text-muted-foreground">
            {ASK_MAPABLE_EMPTY_STATE.body}
          </p>
          <ul className="grid gap-2">
            {starters.map((starter) => (
              <li key={starter.id}>
                <button
                  type="button"
                  className="min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    if (starter.href && starter.id === "talk-person") {
                      router.push(starter.href);
                      return;
                    }
                    if (starter.href && starter.id === "report-barrier") {
                      router.push(starter.href);
                      return;
                    }
                    if (starter.href && starter.id === "find-provider") {
                      router.push(starter.href);
                      return;
                    }
                    void send(starter.prompt);
                  }}
                >
                  {starter.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Ask MapAble conversation"
        className="min-h-[12rem] flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-6 bg-primary text-primary-foreground"
                : "mr-6 bg-card text-foreground"
            }`}
          >
            <p className="sr-only">
              {m.role === "user" ? "You" : "Ask MapAble"}
            </p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {pending ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {status ?? ASK_MAPABLE_PENDING}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <label className="sr-only" htmlFor="ask-mapable-composer">
          Message Ask MapAble
        </label>
        <textarea
          id="ask-mapable-composer"
          ref={inputRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
          placeholder="Type your question…"
          className="min-h-11 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <Button
          type="button"
          variant="default"
          size="default"
          className="min-h-11 min-w-11 self-end"
          loading={pending}
          disabled={!input.trim() || pending}
          onClick={() => void send(input)}
        >
          Send
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Typed input always works. Voice is optional and never auto-sends.
      </p>
    </div>
  );
}
