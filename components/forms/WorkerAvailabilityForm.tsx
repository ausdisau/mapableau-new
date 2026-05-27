"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type Day = (typeof DAYS)[number];

type WindowRow = {
  dayOfWeek: Day;
  startTime: string;
  endTime: string;
};

export function WorkerAvailabilityForm({
  initialWindows,
  onSaved,
}: {
  initialWindows: WindowRow[];
  onSaved?: () => void;
}) {
  const [windows, setWindows] = useState<WindowRow[]>(
    initialWindows.length > 0
      ? initialWindows
      : [{ dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00" }]
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/worker-profile/availability", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ windows }),
        });
        setLoading(false);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Could not save availability");
          return;
        }
        onSaved?.();
      }}
    >
      <ul className="space-y-3">
        {windows.map((w, i) => (
          <li key={i} className="flex flex-wrap gap-2 items-end">
            <AccessibleFormField id={`day-${i}`} label="Day">
              <select
                id={`day-${i}`}
                className={formInputClass}
                value={w.dayOfWeek}
                onChange={(e) => {
                  const next = [...windows];
                  next[i] = {
                    ...next[i],
                    dayOfWeek: e.target.value as Day,
                  };
                  setWindows(next);
                }}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </AccessibleFormField>
            <AccessibleFormField id={`start-${i}`} label="Start">
              <input
                id={`start-${i}`}
                type="time"
                className={formInputClass}
                value={w.startTime}
                onChange={(e) => {
                  const next = [...windows];
                  next[i] = { ...next[i], startTime: e.target.value };
                  setWindows(next);
                }}
              />
            </AccessibleFormField>
            <AccessibleFormField id={`end-${i}`} label="End">
              <input
                id={`end-${i}`}
                type="time"
                className={formInputClass}
                value={w.endTime}
                onChange={(e) => {
                  const next = [...windows];
                  next[i] = { ...next[i], endTime: e.target.value };
                  setWindows(next);
                }}
              />
            </AccessibleFormField>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWindows(windows.filter((_, j) => j !== i))}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={() =>
          setWindows([
            ...windows,
            { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00" },
          ])
        }
      >
        Add slot
      </Button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save availability
      </Button>
    </form>
  );
}
