"use client";

import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import type { MobilityAidPreference } from "@/lib/access/experience/types";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

const MOBILITY_OPTIONS: Array<{
  value: MobilityAidPreference;
  label: string;
}> = [
  { value: "none", label: "No mobility aid" },
  { value: "manual_wheelchair", label: "Manual wheelchair" },
  { value: "power_wheelchair", label: "Power wheelchair" },
  { value: "mobility_scooter", label: "Mobility scooter" },
  { value: "walker", label: "Walker / rollator" },
  { value: "cane", label: "Cane / walking stick" },
  { value: "prosthetic", label: "Prosthetic" },
  { value: "assistance_animal", label: "Assistance animal" },
  { value: "other", label: "Other mobility aid" },
];

export function AccessMobilityPreferences({
  value,
  onChange,
}: {
  value: AccessRequirementProfile;
  onChange: (next: AccessRequirementProfile) => void;
}) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4"
      aria-labelledby="mobility-preferences-heading"
    >
      <h2
        id="mobility-preferences-heading"
        className="text-sm font-semibold text-[#0C1833]"
      >
        Mobility and walking preferences
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        These are functional preferences for discovery and route planning. They do
        not disclose a diagnosis and do not certify a route as accessible.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">
          Mobility aid
          <select
            className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
            value={value.mobilityAidPreference ?? "none"}
            onChange={(event) => {
              const mobilityAidPreference =
                event.target.value as MobilityAidPreference;
              onChange({
                ...value,
                mobilityAidPreference,
                wheelchairUser:
                  mobilityAidPreference === "manual_wheelchair",
                powerchairUser:
                  mobilityAidPreference === "power_wheelchair",
              });
            }}
          >
            {MOBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-800">
          Comfortable short-distance walking
          <select
            className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
            value={
              value.maximumComfortableWalkingDistanceMetres == null
                ? ""
                : String(value.maximumComfortableWalkingDistanceMetres)
            }
            onChange={(event) =>
              onChange({
                ...value,
                maximumComfortableWalkingDistanceMetres:
                  event.target.value === ""
                    ? null
                    : Number(event.target.value),
              })
            }
          >
            <option value="">Not specified</option>
            <option value="25">Up to 25 metres</option>
            <option value="50">Up to 50 metres</option>
            <option value="100">Up to 100 metres</option>
            <option value="200">Up to 200 metres</option>
            <option value="500">Up to 500 metres</option>
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Walking distance is retained as a preference until route-segment distance
        evidence is available. Unknown distance is not treated as a barrier.
      </p>
    </section>
  );
}
