"use client";

import { useId, useState } from "react";

import { makeSyntheticMorningRoutine } from "@/lib/day/synthetic-fixtures";

/**
 * Synthetic Care Routine Studio preview — not a clinical record.
 * Does not persist real instructions to localStorage.
 */
export function DayRoutinesDemo() {
  const headingId = useId();
  const statusId = useId();
  const [steps, setSteps] = useState(() => makeSyntheticMorningRoutine());
  const [status, setStatus] = useState("Demo ready — nothing saved to your records.");

  function reset() {
    setSteps(makeSyntheticMorningRoutine());
    setStatus("Reset to the synthetic morning routine. No personal data stored.");
  }

  function toggleOptional(id: string) {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, optional: !step.optional } : step,
      ),
    );
    setStatus("Preview updated locally in this session only. Not a clinical save.");
  }

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-2xl border border-dashed border-[#005B7F]/40 bg-[#F8FBFE] p-5"
      data-testid="day-routines-demo"
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#005B7F]">
          Synthetic demo
        </p>
        <h2 id={headingId} className="font-heading text-xl font-bold text-[#0C1833]">
          Care Routine Studio preview
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Example morning steps only. This is not a clinical record and does not
          write to support profiles or device storage of real instructions.
        </p>
      </div>

      <p id={statusId} className="text-sm font-semibold text-[#0C1833]" role="status" aria-live="polite">
        {status}
      </p>

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-bold text-[#0C1833]">
                {index + 1}. {step.label}
              </p>
              <p className="text-xs text-slate-600">
                ~{step.estimatedMinutes} min
                {step.optional ? " · optional" : " · required in demo"}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#005B7F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              onClick={() => toggleOptional(step.id)}
              aria-describedby={statusId}
            >
              Toggle optional
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        onClick={reset}
      >
        Reset demo
      </button>
    </section>
  );
}
