"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type VehicleFeatures = {
  wheelchairAccessible: boolean;
  rampAvailable: boolean;
  liftAvailable: boolean;
  hoistAvailable: boolean;
  assistanceAnimalFriendly: boolean;
};

export function TransportVehicleFeaturesEditor({
  organisationId,
  vehicleId,
  features,
  onSaved,
}: {
  organisationId: string;
  vehicleId: string;
  features: VehicleFeatures | null;
  onSaved: () => void;
}) {
  const [state, setState] = useState<VehicleFeatures>({
    wheelchairAccessible: features?.wheelchairAccessible ?? false,
    rampAvailable: features?.rampAvailable ?? false,
    liftAvailable: features?.liftAvailable ?? false,
    hoistAvailable: features?.hoistAvailable ?? false,
    assistanceAnimalFriendly: features?.assistanceAnimalFriendly ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/provider/transport/vehicles/${vehicleId}/features?organisationId=${organisationId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not save features");
      return;
    }
    onSaved();
  }

  const toggles: Array<{ key: keyof VehicleFeatures; label: string }> = [
    { key: "wheelchairAccessible", label: "Wheelchair accessible" },
    { key: "rampAvailable", label: "Ramp available" },
    { key: "liftAvailable", label: "Lift available" },
    { key: "hoistAvailable", label: "Hoist available" },
    { key: "assistanceAnimalFriendly", label: "Assistance animal friendly" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Mobility features</h3>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="space-y-2">
        {toggles.map(({ key, label }) => (
          <li key={key}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state[key]}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, [key]: e.target.checked }))
                }
              />
              {label}
            </label>
          </li>
        ))}
      </ul>
      <Button type="button" loading={loading} onClick={() => save()}>
        Save mobility features
      </Button>
    </div>
  );
}
