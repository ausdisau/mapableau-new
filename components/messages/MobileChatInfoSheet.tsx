"use client";

import { useEffect, useRef } from "react";

export function MobileChatInfoSheet({
  open,
  onClose,
  conversationId,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close chat info"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="chat-info-title"
        className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <h2 id="chat-info-title" className="font-heading text-lg font-bold">
          Chat options
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversation {conversationId.slice(0, 8)}
        </p>
        <ul className="mt-4 space-y-2">
          {["Report", "Mute", "Block"].map((action) => (
            <li key={action}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center rounded-lg border border-border px-4 text-left font-medium hover:bg-muted"
              >
                {action}
              </button>
            </li>
          ))}
        </ul>
        <button
          ref={closeRef}
          type="button"
          className="mt-4 min-h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
