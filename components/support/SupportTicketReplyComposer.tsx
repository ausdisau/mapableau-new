"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupportTicketReplyComposer({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  return (
    <form
      className="mt-6 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("Sending…");
        const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (res.ok) {
          setBody("");
          setStatus("Sent.");
          router.refresh();
        } else {
          setStatus("Could not send.");
        }
      }}
    >
      <label htmlFor="reply" className="block text-sm font-medium">
        Add a reply
      </label>
      <textarea
        id="reply"
        rows={3}
        required
        className="w-full border rounded-md px-3 py-2"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        type="submit"
        className="min-h-11 px-4 rounded-md bg-blue-700 text-white font-medium"
      >
        Send reply
      </button>
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </form>
  );
}
