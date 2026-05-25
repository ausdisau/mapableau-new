"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Estimate = {
  distanceKm: number;
  durationMinutes: number;
  source: string;
};

export function RouteEstimatePanel({
  transportBookingId,
  routingEnabled,
}: {
  transportBookingId: string;
  routingEnabled: boolean;
}) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!routingEnabled) return null;

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h2 className="font-heading text-lg font-semibold">Route estimate</h2>
      {estimate ? (
        <p className="text-sm">
          About {estimate.durationMinutes} minutes (
          {estimate.distanceKm.toFixed(1)} km straight-line, {estimate.source}).
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Generate an accessible route estimate from the trip addresses.
        </p>
      )}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const res = await fetch(
              `/api/transport/bookings/${transportBookingId}/route-estimate`,
            );
            setLoading(false);
            const data = await res.json();
            if (!res.ok) {
              setMessage(data.error ?? "Could not calculate route estimate");
              return;
            }
            setEstimate(data.estimate);
          }}
        >
          Refresh estimate
        </Button>
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={async () => {
            const res = await fetch(
              `/api/transport/bookings/${transportBookingId}/route-plan`,
              { method: "POST" },
            );
            setMessage(
              res.ok ? "Route plan created." : "Route plan unavailable.",
            );
          }}
        >
          Generate route plan
        </Button>
      </div>
    </section>
  );
}
