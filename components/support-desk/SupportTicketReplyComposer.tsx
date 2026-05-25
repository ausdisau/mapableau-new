"use client";

import { useState } from "react";

export function SupportTicketReplyComposer({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");

  async function send() {
    await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBody("");
  }

  return (
    <div className="space-y-2">
      <label htmlFor="reply" className="font-medium">
        Reply
      </label>
      <textarea
        id="reply"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-24 w-full rounded-lg border border-input px-3"
      />
      <button
        type="button"
        onClick={() => void send()}
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
      >
        Send reply
      </button>
    </div>
  );
}
