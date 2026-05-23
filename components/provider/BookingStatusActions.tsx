"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function BookingStatusActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState("");

  async function accept() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/provider/bookings/${bookingId}/accept`, {
      method: "POST",
    });
    if (!res.ok) setError("Could not accept booking");
    setLoading(false);
    window.location.reload();
  }

  async function decline() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/provider/bookings/${bookingId}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: declineReason }),
    });
    if (!res.ok) setError("Could not decline booking");
    setLoading(false);
    window.location.reload();
  }

  async function markInProgress() {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    setLoading(false);
    window.location.reload();
  }

  const canAccept =
    status === "requested" || status === "awaiting_provider_acceptance";
  const canProgress = status === "confirmed" || status === "accepted";

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {canAccept && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="default" size="default" onClick={accept} disabled={loading}>
            Accept request
          </Button>
          <label className="flex w-full flex-col gap-1 text-sm">
            Decline reason
            <textarea
              className="rounded border p-2"
              rows={2}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={decline}
            disabled={loading}
          >
            Decline request
          </Button>
        </div>
      )}
      {canProgress && (
        <Button type="button" variant="default" size="default" onClick={markInProgress} disabled={loading}>
          Mark in progress
        </Button>
      )}
    </div>
  );
}
