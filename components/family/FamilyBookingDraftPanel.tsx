"use client";

import { useState } from "react";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function FamilyBookingDraftPanel({ participantId }: { participantId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function createDraft() {
    const res = await fetch("/api/family/bookings/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        bookingType: "care",
        requestedStart: new Date(Date.now() + 86400000 * 7).toISOString(),
        notes: "Draft created by family supporter",
      }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? data.message
        : data.error ?? "Could not create draft"
    );
  }

  return (
    <MapAbleCard title="Booking assistance">
      <p className="text-sm text-muted-foreground">
        Draft a booking for the participant to confirm before it is sent to a provider.
      </p>
      {message ? (
        <p role="status" aria-live="polite" className="mt-3 text-sm">
          {message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={createDraft}
        className="mt-4 min-h-11 rounded-lg border px-4 py-2"
      >
        Create booking draft
      </button>
    </MapAbleCard>
  );
}
