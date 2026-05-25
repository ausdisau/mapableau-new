"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { useFormAutosave } from "@/lib/hooks/useFormAutosave";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

export function MessageComposer({
  conversationId,
  onSend,
}: {
  conversationId: string;
  onSend?: (body: string) => Promise<void>;
}) {
  const { online } = useNetworkStatus();
  const draftKey = `message:${conversationId}`;
  const { value, setValue, status } = useFormAutosave(draftKey, "", "message");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    const body = value.trim();
    if (!body || sending || !online) return;

    setSending(true);
    setError(null);
    try {
      if (onSend) {
        await onSend(body);
      } else {
        const res = await fetch(
          `/api/messages/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body }),
          }
        );
        if (!res.ok) throw new Error("send failed");
      }
      setValue("");
    } catch {
      setError("Could not send message. Try again when you are online.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-card px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {!online ? (
        <p className="mb-2 text-xs text-amber-800" role="status">
          Offline — message will stay as a draft until you reconnect.
        </p>
      ) : null}
      {error ? (
        <p className="mb-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-end gap-2">
        <label htmlFor={`composer-${conversationId}`} className="sr-only">
          Message
        </label>
        <textarea
          id={`composer-${conversationId}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          placeholder="Write a message"
          className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-base focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          disabled={!value.trim() || sending || !online}
          aria-label="Send message"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          onClick={() => void sendMessage()}
        >
          <Send className="h-6 w-6" aria-hidden />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {status === "saved" ? "Draft saved" : ""}
      </p>
    </div>
  );
}
