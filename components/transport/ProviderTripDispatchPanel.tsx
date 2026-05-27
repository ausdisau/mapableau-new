"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import type { TransportTripApiResponse } from "@/types/transport";

type Suggestion = {
  vehicleId: string;
  driverId: string | null;
  vehicleName: string;
  driverName: string | null;
  score: number;
  vehicleEligible: boolean;
  driverEligible: boolean;
  reasons: string[];
};

export function ProviderTripDispatchPanel({
  organisationId,
}: {
  organisationId: string;
}) {
  const [trips, setTrips] = useState<TransportTripApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({});
  const [selection, setSelection] = useState<
    Record<string, { driverId: string; vehicleId: string }>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/provider/transport/trips?organisationId=${encodeURIComponent(organisationId)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load trips");
        return;
      }
      setTrips(data.trips ?? []);
    } catch {
      setError("Could not load trips");
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadSuggestions(tripId: string) {
    const res = await fetch(
      `/api/provider/transport/trips/${tripId}/match-suggestions?organisationId=${encodeURIComponent(organisationId)}`
    );
    const data = await res.json();
    if (res.ok) {
      setSuggestions((prev) => ({ ...prev, [tripId]: data.suggestions ?? [] }));
      const top = data.suggestions?.[0];
      if (top?.driverId) {
        setSelection((prev) => ({
          ...prev,
          [tripId]: { driverId: top.driverId, vehicleId: top.vehicleId },
        }));
      }
    }
  }

  async function assign(tripId: string) {
    const sel = selection[tripId];
    if (!sel?.driverId || !sel?.vehicleId) {
      setError("Select a driver and vehicle before assigning.");
      return;
    }
    setAssigning(tripId);
    setError(null);
    try {
      const res = await fetch(
        `/api/provider/transport/trips/${tripId}/assign?organisationId=${encodeURIComponent(organisationId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sel),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const detailReasons =
          data.details?.reasons && Array.isArray(data.details.reasons)
            ? data.details.reasons.join("; ")
            : null;
        setError(detailReasons ?? data.error ?? "Assignment failed");
        return;
      }
      await load();
    } catch {
      setError("Assignment failed");
    } finally {
      setAssigning(null);
    }
  }

  if (loading) return <p>Loading dispatch board…</p>;

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Assign drivers and vehicles manually. Match scores are advisory only — a
        dispatcher must confirm every assignment.
      </p>
      {trips.length === 0 ? (
        <p className="text-sm">
          No transport trips yet.{" "}
          <Link href="/provider/vehicles" className="text-primary underline">
            Set up vehicles
          </Link>{" "}
          before dispatching.
        </p>
      ) : (
        <ul className="space-y-4">
          {trips.map(({ trip, permissions }) => (
            <li
              key={trip.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <TransportTripStatusBadge status={trip.status} />
                <span className="text-sm text-muted-foreground">
                  {new Date(trip.scheduledStart).toLocaleString("en-AU")}
                </span>
              </div>
              <p className="text-sm">
                <span className="font-medium">Pickup:</span>{" "}
                {trip.pickup.address ?? trip.pickup.suburb}
              </p>
              <p className="text-sm">
                <span className="font-medium">Drop-off:</span>{" "}
                {trip.dropoff.address ?? trip.dropoff.suburb}
              </p>
              {permissions.canAssign ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadSuggestions(trip.id)}
                  >
                    Show match suggestions
                  </Button>
                  {(suggestions[trip.id] ?? []).slice(0, 3).map((s) => (
                    <div key={s.vehicleId} className="text-sm rounded-lg bg-muted p-2">
                      <p>
                        {s.vehicleName}
                        {s.driverName ? ` · ${s.driverName}` : ""} — score {s.score}
                      </p>
                      {!s.vehicleEligible || !s.driverEligible ? (
                        <p className="text-destructive">{s.reasons.join("; ")}</p>
                      ) : null}
                    </div>
                  ))}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-sm">
                      Driver ID
                      <input
                        className={formInputClass}
                        value={selection[trip.id]?.driverId ?? ""}
                        onChange={(e) =>
                          setSelection((prev) => ({
                            ...prev,
                            [trip.id]: {
                              ...prev[trip.id],
                              driverId: e.target.value,
                              vehicleId: prev[trip.id]?.vehicleId ?? "",
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Vehicle ID
                      <input
                        className={formInputClass}
                        value={selection[trip.id]?.vehicleId ?? ""}
                        onChange={(e) =>
                          setSelection((prev) => ({
                            ...prev,
                            [trip.id]: {
                              driverId: prev[trip.id]?.driverId ?? "",
                              vehicleId: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                  <Button
                    type="button"
                    loading={assigning === trip.id}
                    onClick={() => void assign(trip.id)}
                  >
                    Assign
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
