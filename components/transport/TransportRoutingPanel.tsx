"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

type RouteEstimate = {
  distanceKm: number;
  durationMinutes: number;
  source: string;
};

type Props = {
  transportBookingId: string;
  routingEnabled: boolean;
  optimisationEnabled: boolean;
  initialEstimate?: RouteEstimate | null;
};

export function TransportRoutingPanel({
  transportBookingId,
  routingEnabled,
  optimisationEnabled,
  initialEstimate,
}: Props) {
  const [estimate, setEstimate] = useState<RouteEstimate | null>(
    initialEstimate ?? null,
  );
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEstimate = useCallback(async () => {
    if (!routingEnabled) return;
    setLoadingEstimate(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/transport/bookings/${transportBookingId}/route-estimate`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load route estimate");
        return;
      }
      setEstimate(data.estimate);
    } catch {
      setError("Could not load route estimate");
    } finally {
      setLoadingEstimate(false);
    }
  }, [routingEnabled, transportBookingId]);

  const generatePlan = async () => {
    setLoadingPlan(true);
    setError(null);
    setPlanMessage(null);
    try {
      const res = await fetch(
        `/api/transport/bookings/${transportBookingId}/route-plan`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate route plan");
        return;
      }
      setPlanMessage(
        data.plan?.id
          ? `Route plan created (${data.plan.id.slice(0, 8)}…). Review options in admin or operator tools when available.`
          : "Route plan created.",
      );
      if (data.estimate) setEstimate(data.estimate);
    } catch {
      setError("Could not generate route plan");
    } finally {
      setLoadingPlan(false);
    }
  };

  if (!routingEnabled && !optimisationEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Route planning is not enabled for this environment.
      </p>
    );
  }

  return (
    <section
      className="space-y-3 rounded-lg border border-border p-4"
      aria-labelledby="transport-routing-heading"
    >
      <h2 id="transport-routing-heading" className="text-lg font-semibold">
        Route estimate
      </h2>
      {estimate ? (
        <p className="text-sm">
          About <strong>{estimate.durationMinutes} min</strong> (
          {estimate.distanceKm.toFixed(1)} km straight-line). Source:{" "}
          {estimate.source}.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No estimate yet. Refresh to geocode addresses and calculate distance.
        </p>
      )}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {planMessage ? (
        <p className="text-sm text-muted-foreground" role="status">
          {planMessage}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {routingEnabled ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            loading={loadingEstimate}
            onClick={() => void refreshEstimate()}
          >
            Refresh estimate
          </Button>
        ) : null}
        <Button
          type="button"
          variant="default"
          size="default"
          loading={loadingPlan}
          onClick={() => void generatePlan()}
        >
          Generate route plan
        </Button>
      </div>
    </section>
  );
}
