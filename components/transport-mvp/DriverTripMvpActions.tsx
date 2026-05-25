"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  { value: "driver_en_route", label: "En route to pickup" },
  { value: "arrived_pickup", label: "Arrived for pickup" },
  { value: "on_board", label: "Participant on board" },
  { value: "in_transit", label: "In transit" },
  { value: "arrived_dropoff", label: "Arrived at destination" },
  { value: "completed", label: "Complete trip" },
];

export function DriverTripMvpActions({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: string) {
    if (status === "completed" && !confirm("Mark trip complete? Evidence must be recorded first.")) {
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/transport-mvp/trips/${tripId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div role="group" aria-label="Update trip status" className="space-y-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            disabled={loading}
            onClick={() => setStatus(s.value)}
            className="flex min-h-14 w-full items-center justify-center rounded-xl border bg-primary px-4 text-base font-semibold text-primary-foreground disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
