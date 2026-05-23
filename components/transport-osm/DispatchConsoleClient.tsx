"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { MapLibreMap, type MapMarker } from "./MapLibreMap";

type LiveTrip = {
  id: string;
  status: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  pickupAddress: string;
  vehicle?: string;
  driver?: string;
  lastLocation?: { lat: number | null; lng: number | null } | null;
};

type Recommendation = {
  driverProfileId: string;
  vehicleId: string;
  driverName: string;
  vehicleName: string;
  score: number;
  warnings: string[];
};

export function DispatchConsoleClient({
  initialBookingId,
}: {
  initialBookingId?: string;
}) {
  const [trips, setTrips] = useState<LiveTrip[]>([]);
  const [selectedId, setSelectedId] = useState(initialBookingId ?? "");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");

  const loadLive = useCallback(async () => {
    const res = await fetch("/api/transport/dispatch/live");
    if (res.ok) {
      const data = await res.json();
      setTrips(data.trips ?? []);
    }
  }, []);

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 30000);
    return () => clearInterval(t);
  }, [loadLive]);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/transport/dispatch/recommendations?bookingId=${selectedId}`)
      .then((r) => r.json())
      .then((d) => setRecommendations(d.recommendations ?? []));
  }, [selectedId]);

  const markers: MapMarker[] = [];
  for (const t of trips) {
    if (t.pickupLat != null && t.pickupLng != null) {
      markers.push({
        id: `${t.id}-p`,
        lat: t.pickupLat,
        lng: t.pickupLng,
        label: t.pickupAddress,
        kind: "pickup",
      });
    }
    const loc = t.lastLocation;
    if (loc?.lat != null && loc?.lng != null) {
      markers.push({
        id: `${t.id}-v`,
        lat: loc.lat,
        lng: loc.lng,
        label: t.vehicle ?? "Vehicle",
        kind: "vehicle",
      });
    }
  }

  async function assign(rec: Recommendation) {
    setAssigning(true);
    setMessage("");
    const res = await fetch("/api/transport/dispatch/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transportBookingId: selectedId,
        driverProfileId: rec.driverProfileId,
        vehicleId: rec.vehicleId,
      }),
    });
    setAssigning(false);
    if (res.ok) {
      setMessage("Assignment saved.");
      loadLive();
    } else {
      const err = await res.json();
      setMessage(err.error ?? "Assignment failed");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active trips</h2>
        <ul className="space-y-2">
          {trips.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 ${
                  selectedId === t.id ? "border-primary bg-muted" : "border-border"
                }`}
              >
                <span className="font-medium">{t.status.replace(/_/g, " ")}</span>
                <span className="block text-muted-foreground">{t.pickupAddress}</span>
              </button>
            </li>
          ))}
        </ul>
        {selectedId && recommendations.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-medium">Recommended assignments</h3>
            <ul className="space-y-2">
              {recommendations.slice(0, 5).map((r) => (
                <li key={`${r.driverProfileId}-${r.vehicleId}`} className="rounded border p-3 text-sm">
                  <p>
                    {r.driverName} — {r.vehicleName} (score {r.score})
                  </p>
                  {r.warnings.length > 0 ? (
                    <ul className="mt-1 list-disc pl-4 text-amber-800 dark:text-amber-200">
                      {r.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 min-h-11"
                    loading={assigning}
                    onClick={() => assign(r)}
                  >
                    Assign
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {message ? (
          <p role="status" className="text-sm">
            {message}
          </p>
        ) : null}
      </div>
      <MapLibreMap markers={markers} ariaLabel="Live dispatch map" height={420} />
    </div>
  );
}
