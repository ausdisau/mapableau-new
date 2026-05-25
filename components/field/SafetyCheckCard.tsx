"use client";

import { useState } from "react";

export function SafetyCheckCard({
  onComplete,
}: {
  onComplete?: (passed: boolean) => void;
}) {
  const [checks, setChecks] = useState({
    wheelchairSecure: false,
    seatbelt: false,
    routeClear: false,
  });

  const criticalFail = !checks.wheelchairSecure || !checks.seatbelt;
  const allPass =
    checks.wheelchairSecure && checks.seatbelt && checks.routeClear;

  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="font-semibold">Safe loading checklist</legend>
      {(
        [
          ["wheelchairSecure", "Mobility equipment secured"],
          ["seatbelt", "Seatbelts and restraints checked"],
          ["routeClear", "Pickup area clear"],
        ] as const
      ).map(([key, label]) => (
        <label
          key={key}
          className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
        >
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={checks[key]}
            onChange={(e) => {
              const next = { ...checks, [key]: e.target.checked };
              setChecks(next);
              onComplete?.(
                next.wheelchairSecure &&
                  next.seatbelt &&
                  next.routeClear
              );
            }}
          />
          {label}
        </label>
      ))}
      {criticalFail ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          Critical items must pass before marking trip ready.
        </p>
      ) : allPass ? (
        <p className="text-sm font-medium text-secondary" role="status">
          Checklist complete. You may proceed.
        </p>
      ) : null}
    </fieldset>
  );
}
