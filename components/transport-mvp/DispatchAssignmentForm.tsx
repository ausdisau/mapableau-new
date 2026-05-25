"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FleetDriver = { id: string; displayName: string; verificationStatus: string };
type FleetVehicle = { id: string; displayName: string; verificationStatus: string };

export function DispatchAssignmentForm({
  tripId,
  organisationId,
}: {
  tripId: string;
  organisationId: string;
}) {
  const router = useRouter();
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [override, setOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/transport-mvp/fleet?organisationId=${organisationId}`)
      .then((r) => r.json())
      .then((d) => {
        setDrivers(d.drivers ?? []);
        setVehicles(d.vehicles ?? []);
      });
  }, [organisationId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/transport-mvp/trips/${tripId}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, vehicleId, allowSuitabilityOverride: override }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Dispatch failed");
      return;
    }
    router.push(`/provider/transport/trips/${tripId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      {error ? (
        <p className="rounded-lg border border-destructive/50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        Driver
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
          required
        >
          <option value="">Select driver</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.displayName} ({d.verificationStatus})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Vehicle
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
          required
        >
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.displayName} ({v.verificationStatus})
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={override}
          onChange={(e) => setOverride(e.target.checked)}
          className="h-5 w-5"
        />
        Override vehicle suitability warnings (provider admin only)
      </label>
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 rounded-lg bg-primary px-6 font-semibold text-primary-foreground"
      >
        Assign dispatch
      </button>
    </form>
  );
}
