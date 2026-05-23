"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ParticipantTripActions({
  transportBookingId,
  status,
}: {
  transportBookingId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function requestQuote() {
    setLoading(true);
    const res = await fetch("/api/transport/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transportBookingId }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Quote ready. Review fare and confirm below.");
      window.location.reload();
    } else {
      setMessage("Could not generate quote.");
    }
  }

  async function confirmQuote() {
    setLoading(true);
    const res = await fetch(
      `/api/transport/bookings/${transportBookingId}/confirm-quote`,
      { method: "POST" }
    );
    setLoading(false);
    if (res.ok) {
      setMessage("Trip confirmed. Your provider will be notified.");
      window.location.reload();
    } else {
      setMessage("Could not confirm quote.");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "draft" || status === "quote_requested") && (
        <Button
          type="button"
          variant="default"
          size="default"
          className="min-h-11"
          loading={loading}
          onClick={requestQuote}
        >
          Get quote
        </Button>
      )}
      {status === "quoted" && (
        <Button
          type="button"
          variant="default"
          size="default"
          className="min-h-11"
          loading={loading}
          onClick={confirmQuote}
        >
          Confirm quote
        </Button>
      )}
      {message ? (
        <p role="status" className="w-full text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
