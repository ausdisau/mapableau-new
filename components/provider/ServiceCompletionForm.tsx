"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ServiceCompletionForm({ bookingId }: { bookingId: string }) {
  const [actualStartAt, setActualStartAt] = useState("");
  const [actualEndAt, setActualEndAt] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [message, setMessage] = useState("");

  async function complete() {
    const res = await fetch(`/api/bookings/${bookingId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actualStartAt: new Date(actualStartAt).toISOString(),
        actualEndAt: new Date(actualEndAt).toISOString(),
        completionNotes,
      }),
    });
    setMessage(
      res.ok
        ? "Service marked complete. You can create an invoice."
        : "Could not complete service."
    );
    if (res.ok) window.location.reload();
  }

  return (
    <section className="rounded-lg border p-4" aria-labelledby="complete-service">
      <h2 id="complete-service" className="font-semibold">
        Complete service
      </h2>
      <label className="mt-2 block text-sm">
        Actual start
        <input
          type="datetime-local"
          className="mt-1 w-full rounded border p-2"
          value={actualStartAt}
          onChange={(e) => setActualStartAt(e.target.value)}
        />
      </label>
      <label className="mt-2 block text-sm">
        Actual end
        <input
          type="datetime-local"
          className="mt-1 w-full rounded border p-2"
          value={actualEndAt}
          onChange={(e) => setActualEndAt(e.target.value)}
        />
      </label>
      <label className="mt-2 block text-sm">
        Notes
        <textarea
          className="mt-1 w-full rounded border p-2"
          rows={3}
          value={completionNotes}
          onChange={(e) => setCompletionNotes(e.target.value)}
        />
      </label>
      <Button type="button" variant="default" size="default" className="mt-3" onClick={complete}>
        Mark completed
      </Button>
      {message && (
        <p className="mt-2 text-sm" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}
