"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AskMapAbleChoiceChips } from "@/components/ask-mapable/AskMapAbleChoiceChips";
import { AskMapAbleResponseActions } from "@/components/ask-mapable/AskMapAbleResponseActions";
import { Button } from "@/components/ui/button";
import {
  ASK_MAPABLE_EMPTY_STATE,
  ASK_MAPABLE_NAME,
  ASK_MAPABLE_PENDING,
  ASK_MAPABLE_SAFE_FAILURE,
  resolveMapAbleModule,
  startersForPageContext,
} from "@/lib/ask-mapable";
import type { CopilotAction, CopilotAskResponse } from "@/lib/copilot/types";

import type { AskChatMessage } from "./types";

type Props = {
  sessionId: string | null;
  onEnsureSession: (title?: string) => string;
  messages: AskChatMessage[];
  onAppend: (sessionId: string, messages: AskChatMessage[], title?: string) => void;
  seedMessage?: string | null;
  onSeedConsumed?: () => void;
  maxVisibleChoices?: number;
};

type CrisisPreflightResponse = {
  intercepted?: boolean;
  response?: CopilotAskResponse | null;
};

export function AskMapAbleChatTab({
  sessionId,
  onEnsureSession,
  messages,
  onAppend,
  seedMessage,
  onSeedConsumed,
  maxVisibleChoices = 3,
}: Props) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseActions, setResponseActions] = useState<CopilotAction[]>([]);
  const [blockedActions, setBlockedActions] = useState<CopilotAction[]>([]);
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
  const humanHelpStarter = useMemo(
    () => starters.find((starter) => starter.id === "talk-person"),
    [starters],
  );
  const starterChoices = useMemo(
    () =>
      starters
        .filter((starter) => starter.id !== "talk-person")
        .map((starter) => ({ id: starter.id, label: starter.label })),
    [starters],
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
      setResponseActions([]);
      setBlockedActions([]);

      try {
        const history = [...messages, userMsg]
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }));

        // Deterministic, no-model crisis preflight. Failure here deliberately
        // falls through to the existing MapAble Companion guardrail stack.
        try {
          const safetyRes = await fetch("/api/mapable/crisis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ query, messages: history }),
          });

          if (safetyRes.ok) {
            const safety = (await safetyRes.json()) as CrisisPreflightResponse;
            if (safety.intercepted && safety.response) {
              const safetyResponse = safety.response;
              setResponseActions(safetyResponse.actions ?? []);
              setBlockedActions(safetyResponse.blockedActions ?? []);
              onAppend(sid, [
                {
                  id: `a-${Date.now()}`,
                  role: "assistant",
                  content:
                    safetyResponse.answer ||
                    safetyResponse.summary ||
                    ASK_MAPABLE_SAFE_FAILURE,
                  createdAt: new Date().toISOString(),
                },
              ]);
              return;
            }
          }
        } catch {
          // Safety preflight is additive. Existing server guardrails remain the
          // fallback if this endpoint is unavailable.
        }

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
              ? `Sign in to use ${ASK_MAPABLE_NAME}.`
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

        const answer = data.answer || data.summary || ASK_MAPABLE_SAFE_FAILURE;
        setResponseActions(data.actions ?? []);
        setBlockedActions(data.blockedActions ?? []);
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
          <AskMapAbleChoiceChips
            choices={starterChoices}
            ariaLabel="Suggested ways to start"
            maxVisible={maxVisibleChoices}
            disabled={pending}
            onSelect={(choice) => {
              const starter = starters.find((item) => item.id === choice.id);
              if (!starter) return;
              if (starter.href) {
                router.push(starter.href);
                return;
              }
              void send(starter.prompt);
            }}
          />
          {humanHelpStarter?.href ? (
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border bg-card px-4 py-2 text-left text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => router.push(humanHelpStarter.href!)}
            >
              {humanHelpStarter.label}
            </button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Or type your own question below. Suggested choices never limit what you can ask.
          </p>
        </div>
      ) : null}

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={`${ASK_MAPABLE_NAME} conversation`}
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
              {m.role === "user" ? "You" : ASK_MAPABLE_NAME}
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

      <AskMapAbleResponseActions
        actions={responseActions}
        blockedActions={blockedActions}
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <label className="sr-only" htmlFor="ask-mapable-composer">
          Message {ASK_MAPABLE_NAME}
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
