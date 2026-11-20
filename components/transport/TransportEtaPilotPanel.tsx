"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TransportRouteAdvisory } from "@/components/transport/TransportRouteAdvisory";
import type { TransportTripApiResponse } from "@/types/transport";

type EtaPayload = {
  eta?: TransportTripApiResponse["routeEstimate"] | null;
  advisoryDisclaimer?: string;
  requiresHumanReview?: boolean;
  bookingUnchanged?: boolean;
  error?: string;
};

export function TransportEtaPilotPanel({
  tripId,
  initialEstimate,
  enabled,
}: {
  tripId: string;
  initialEstimate?: TransportTripApiResponse["routeEstimate"];
  enabled: boolean;
}) {
  const router = useRouter();
  const [estimate, setEstimate] = useState(initialEstimate);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"refresh" | "reroute" | null>(null);

  if (!enabled) {
    return estimate ? (
      <TransportRouteAdvisory routeEstimate={estimate} />
    ) : null;
  }

  async function postEta(path: string, kind: "refresh" | "reroute") {
    setBusy(kind);
    setStatus(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = (await res.json()) as EtaPayload;
      if (!res.ok) {
        setStatus(json.error ?? "Could not update the estimate.");
        return;
      }
      if (json.eta) setEstimate(json.eta);
      setStatus(
        kind === "reroute"
          ? "Alternative estimate ready. The booking was not changed. A person still needs to confirm any reroute."
          : "Estimate refreshed. This is advisory only and not a guaranteed arrival time."
      );
      router.refresh();
    } catch {
      setStatus("Could not update the estimate. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {estimate ? <TransportRouteAdvisory routeEstimate={estimate} /> : (
        <p className="text-sm text-muted-foreground" role="status">
          No travel-time estimate yet. You can request an advisory estimate.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="min-h-11 min-w-11"
          disabled={busy !== null}
          onClick={() =>
            void postEta(`/api/transport/trips/${tripId}/eta/refresh`, "refresh")
          }
        >
          {busy === "refresh" ? "Refreshing estimate…" : "Refresh advisory ETA"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 min-w-11"
          disabled={busy !== null}
          onClick={() =>
            void postEta(
              `/api/transport/trips/${tripId}/eta/reroute-advisory`,
              "reroute"
            )
          }
        >
          {busy === "reroute"
            ? "Checking alternative…"
            : "Check alternative route (no booking change)"}
        </Button>
      </div>
      <p className="text-sm" role="status" aria-live="polite">
        {status ?? "Estimates are advisory. They do not change the booked trip."}
      </p>
    </div>
  );
}
