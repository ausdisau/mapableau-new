"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { useFormAutosave } from "@/lib/hooks/useFormAutosave";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

export function MessageComposer({
  conversationId,
}: {
  conversationId: string;
}) {
  const { online } = useNetworkStatus();
  const draftKey = `message:${conversationId}`;
  const { value, setValue, status } = useFormAutosave(draftKey, "");
  const [sending, setSending] = useState(false);

  return (
    <div className="shrink-0 border-t border-border bg-card px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {!online ? (
        <p className="mb-2 text-xs text-amber-800" role="status">
          Offline — message will stay as a draft until you reconnect.
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
          onClick={() => {
            setSending(true);
            setTimeout(() => {
              setValue("");
              setSending(false);
            }, 300);
          }}
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
