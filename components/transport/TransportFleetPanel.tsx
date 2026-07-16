"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type FleetDriver = {
  id: string;
  displayName: string;
  active: boolean;
  eligibility?: { eligible: boolean; reasons: string[] };
};

type FleetVehicle = {
  id: string;
  displayName: string;
  registrationNumber: string | null;
  active: boolean;
  eligibility?: { eligible: boolean; reasons: string[] };
};

export function TransportFleetPanel({
  organisationId,
  initialDrivers,
  initialVehicles,
}: {
  organisationId: string;
  initialDrivers: FleetDriver[];
  initialVehicles: FleetVehicle[];
}) {
  const router = useRouter();
  const [driverName, setDriverName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDriver() {
    if (!driverName.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/provider/transport/drivers?organisationId=${organisationId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: driverName.trim() }),
      }
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not add driver");
      return;
    }
    setDriverName("");
    router.refresh();
  }

  async function createVehicle() {
    if (!vehicleName.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/provider/transport/vehicles?organisationId=${organisationId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: vehicleName.trim(),
          registrationNumber: vehicleReg.trim() || undefined,
        }),
      }
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not add vehicle");
      return;
    }
    setVehicleName("");
    setVehicleReg("");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {error ? (
        <p role="alert" className="col-span-full text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-semibold">Dispatch drivers</h2>
        <p className="text-sm text-muted-foreground">
          Licence, screening and training must be verified before dispatch assignment.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className={formInputClass}
            placeholder="Driver name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
          />
          <Button type="button" loading={loading} onClick={() => createDriver()}>
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {initialDrivers.map((driver) => (
            <li key={driver.id}>
              <Link
                href={`/provider/transport/fleet/drivers/${driver.id}`}
                className="block rounded-lg border border-border p-3 text-sm hover:bg-muted/50"
              >
                <p className="font-medium">{driver.displayName}</p>
                <p className="text-muted-foreground">
                  {driver.eligibility?.eligible
                    ? "Eligible for dispatch"
                    : driver.eligibility?.reasons.join(", ") ?? "Not eligible"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Dispatch vehicles</h2>
        <p className="text-sm text-muted-foreground">
          Registration, insurance and inspection must be verified. Set mobility features for matching.
        </p>
        <div className="space-y-2">
          <input
            type="text"
            className={formInputClass}
            placeholder="Vehicle name"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
          />
          <input
            type="text"
            className={formInputClass}
            placeholder="Registration (optional)"
            value={vehicleReg}
            onChange={(e) => setVehicleReg(e.target.value)}
          />
          <Button type="button" loading={loading} onClick={() => createVehicle()}>
            Add vehicle
          </Button>
        </div>
        <ul className="space-y-2">
          {initialVehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <Link
                href={`/provider/transport/fleet/vehicles/${vehicle.id}`}
                className="block rounded-lg border border-border p-3 text-sm hover:bg-muted/50"
              >
                <p className="font-medium">{vehicle.displayName}</p>
                {vehicle.registrationNumber ? (
                  <p className="text-muted-foreground">{vehicle.registrationNumber}</p>
                ) : null}
                <p className="text-muted-foreground">
                  {vehicle.eligibility?.eligible
                    ? "Eligible for dispatch"
                    : vehicle.eligibility?.reasons.join(", ") ?? "Not eligible"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
