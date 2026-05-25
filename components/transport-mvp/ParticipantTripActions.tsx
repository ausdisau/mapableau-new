"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ParticipantTripActions({
  tripId,
  canConfirm,
  canDispute,
}: {
  tripId: string;
  canConfirm: boolean;
  canDispute: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  async function confirm() {
    setLoading(true);
    await fetch(`/api/transport-mvp/trips/${tripId}/confirm`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function dispute() {
    if (disputeReason.length < 3) return;
    setLoading(true);
    await fetch(`/api/transport-mvp/trips/${tripId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: disputeReason }),
    });
    setLoading(false);
    router.refresh();
  }

  if (!canConfirm && !canDispute) return null;

  return (
    <section className="space-y-4 rounded-xl border p-4" aria-labelledby="participant-trip-actions">
      <h2 id="participant-trip-actions" className="font-heading text-lg font-semibold">
        Confirm your trip
      </h2>
      {canConfirm ? (
        <button
          type="button"
          disabled={loading}
          onClick={confirm}
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
        >
          Confirm trip completed correctly
        </button>
      ) : null}
      {canDispute ? (
        <div className="space-y-2">
          <label htmlFor="dispute-reason" className="text-sm font-medium">
            Dispute reason
          </label>
          <textarea
            id="dispute-reason"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="min-h-24 w-full rounded-lg border px-3 py-2"
            required
          />
          <button
            type="button"
            disabled={loading}
            onClick={dispute}
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-destructive px-4 font-semibold text-destructive"
          >
            Dispute trip
          </button>
        </div>
      ) : null}
    </section>
  );
}
