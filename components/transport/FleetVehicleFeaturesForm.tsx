"use client";

import type { fleetVehicleFeaturesSchema } from "@/lib/validation/transport-fleet-schemas";
import type { z } from "zod";

export type FleetVehicleFeatures = z.infer<typeof fleetVehicleFeaturesSchema>;

const FEATURE_FIELDS: {
  key: keyof FleetVehicleFeatures;
  label: string;
}[] = [
  { key: "wheelchairAccessible", label: "Wheelchair accessible" },
  { key: "rampAvailable", label: "Ramp available" },
  { key: "liftAvailable", label: "Lift available" },
  { key: "hoistAvailable", label: "Hoist available" },
  { key: "assistanceAnimalFriendly", label: "Assistance animal friendly" },
];

export function FleetVehicleFeaturesForm({
  values,
  onChange,
  idPrefix = "fleet-features",
}: {
  values: FleetVehicleFeatures;
  onChange: (next: FleetVehicleFeatures) => void;
  idPrefix?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold">Accessible features</legend>
      <ul className="space-y-2">
        {FEATURE_FIELDS.map(({ key, label }) => {
          const id = `${idPrefix}-${key}`;
          return (
            <li key={key}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  className="mt-1"
                  checked={values[key] === true}
                  onChange={(e) =>
                    onChange({ ...values, [key]: e.target.checked })
                  }
                />
                <span>{label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
