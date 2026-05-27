"use client";

import { useCallback, useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type RideRunRow = {
  id: string;
  status: string;
  scheduledStart: string;
  maxPassengers: number;
  vehicle: { displayName: string };
  driver: { displayName: string } | null;
  trips: Array<{ id: string; status: string }>;
};

export function ProviderRideRunPlanner({
  organisationId,
}: {
  organisationId: string;
}) {
  const [runs, setRuns] = useState<RideRunRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [maxPassengers, setMaxPassengers] = useState(4);
  const [scheduledStart, setScheduledStart] = useState("");
  const [attachRunId, setAttachRunId] = useState("");
  const [attachTripId, setAttachTripId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/transport/runs?organisationId=${encodeURIComponent(organisationId)}`
    );
    const data = await res.json();
    if (res.ok) setRuns(data.runs ?? []);
    else setError(data.error ?? "Could not load runs");
  }, [organisationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <section className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="font-semibold">Create ride run</h2>
        <label className="block text-sm">
          Vehicle ID
          <input
            className={formInputClass}
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Driver ID (optional)
          <input
            className={formInputClass}
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Max passengers
          <input
            type="number"
            min={2}
            max={8}
            className={formInputClass}
            value={maxPassengers}
            onChange={(e) => setMaxPassengers(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          Scheduled start
          <input
            type="datetime-local"
            className={formInputClass}
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
          />
        </label>
        <Button
          type="button"
          onClick={async () => {
            setError(null);
            const res = await fetch(
              `/api/transport/runs?organisationId=${encodeURIComponent(organisationId)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  vehicleId,
                  driverId: driverId || undefined,
                  maxPassengers,
                  scheduledStart: new Date(scheduledStart).toISOString(),
                }),
              }
            );
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Could not create run");
              return;
            }
            await load();
          }}
        >
          Create run
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="font-semibold">Attach trip to run</h2>
        <label className="block text-sm">
          Run ID
          <input
            className={formInputClass}
            value={attachRunId}
            onChange={(e) => setAttachRunId(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Trip ID
          <input
            className={formInputClass}
            value={attachTripId}
            onChange={(e) => setAttachTripId(e.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            setError(null);
            const res = await fetch(
              `/api/transport/runs/${attachRunId}/trips?organisationId=${encodeURIComponent(organisationId)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripId: attachTripId }),
              }
            );
            const data = await res.json();
            if (!res.ok) {
              const reasons = data.details?.reasons?.join?.("; ");
              setError(reasons ?? data.error ?? "Could not attach trip");
              return;
            }
            await load();
          }}
        >
          Attach trip
        </Button>
        <Button
          type="button"
          onClick={async () => {
            setError(null);
            const res = await fetch(
              `/api/transport/runs/${attachRunId}/lock?organisationId=${encodeURIComponent(organisationId)}`,
              { method: "POST" }
            );
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Could not lock run");
              return;
            }
            await load();
          }}
        >
          Lock run (human confirmation)
        </Button>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Active runs</h2>
        <ul className="space-y-2">
          {runs.map((run) => (
            <li key={run.id} className="rounded-lg border border-border p-3 text-sm">
              <p>
                <span className="font-medium">{run.vehicle.displayName}</span> ·{" "}
                {run.status} · {run.trips.length}/{run.maxPassengers} trips
              </p>
              <p className="text-muted-foreground">
                {new Date(run.scheduledStart).toLocaleString("en-AU")}
                {run.driver ? ` · ${run.driver.displayName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
