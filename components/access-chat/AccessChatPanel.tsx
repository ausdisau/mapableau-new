"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { AccessChatComposer } from "@/components/access-chat/AccessChatComposer";
import {
  AccessChatMessageList,
  type AccessChatUiMessage,
} from "@/components/access-chat/AccessChatMessageList";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import type { AccessSearchResult } from "@/types/access-chat";

type Props = {
  onOpenMarker?: (placeId: string) => void;
  onResults?: (results: AccessSearchResult[]) => void;
  compact?: boolean;
  className?: string;
  initialMessage?: string;
};

type MessageResponse = {
  sessionId: string;
  messageId: string;
  replyText: string;
  results: AccessSearchResult[];
  error?: string;
};

export function AccessChatPanel({
  onOpenMarker,
  onResults,
  compact,
  className,
  initialMessage,
}: Props) {
  const listId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [messages, setMessages] = useState<AccessChatUiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareProfile, setShareProfile] = useState(false);
  const initialSent = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      setLoading(true);
      const userMsg: AccessChatUiMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        const res = await fetch("/api/access-chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionId || undefined,
            shareAccessProfile: shareProfile,
          }),
        });
        const data = (await res.json()) as MessageResponse;
        if (!res.ok) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }
        if (data.sessionId) setSessionId(data.sessionId);
        const assistant: AccessChatUiMessage = {
          id: data.messageId || `a-${Date.now()}`,
          role: "assistant",
          content: data.replyText,
          results: data.results,
        };
        setMessages((prev) => [...prev, assistant]);
        onResults?.(data.results ?? []);
      } catch {
        setError(
          "We could not reach Access chat. Check your connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, onResults, sessionId, shareProfile],
  );

  useEffect(() => {
    if (!initialMessage || initialSent.current) return;
    initialSent.current = true;
    void sendMessage(initialMessage);
  }, [initialMessage, sendMessage]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && panelRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      ref={panelRef}
      className={className}
      aria-labelledby="access-chat-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="access-chat-heading"
            className="text-xl font-black tracking-tight text-[#0C1833]"
          >
            Access chat search
          </h2>
          {!compact ? (
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Ask in everyday language. Results use community reports and
              MapAble-verified access information — not legal compliance checks.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <AccessChatMessageList
          messages={messages}
          listId={listId}
          onOpenMarker={onOpenMarker}
          onRefine={(suggestion) => setInput(suggestion)}
          shareAccessProfile={shareProfile}
        />

        {loading ? (
          <p className="text-sm font-medium text-slate-700" role="status" aria-live="polite">
            Searching accessible places…
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border-2 border-red-800 bg-red-50 p-3 text-sm text-red-950" role="alert">
            {error}
          </p>
        ) : null}

        <fieldset className="rounded-xl border-2 border-slate-200 p-3">
          <legend className="px-1 text-sm font-semibold text-[#0C1833]">
            Privacy
          </legend>
          <label className="flex min-h-11 items-start gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={shareProfile}
              onChange={(e) => setShareProfile(e.target.checked)}
            />
            <span>
              I consent to share my access needs (mobility aid, ramp preference,
              crowd preference) with the search assistant for this session only.
              Search works without this.
            </span>
          </label>
        </fieldset>

        <AccessChatComposer
          value={input}
          onChange={setInput}
          onSubmit={() => void sendMessage(input)}
          disabled={loading}
        />

        <p className="text-xs text-slate-500">{ACCESS_DISCLAIMER}</p>
      </div>
    </section>
  );
}
