"use client";

import React, { useState } from "react";

import { QUICK_OBSERVATION_OPTIONS } from "@/lib/access/experience/quick-observation-types";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Step = "select" | "note" | "review" | "submitting";

export function QuickObservationDialog({
  place,
  onClose,
  onSubmitted,
}: {
  place: { id: string; name: string };
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState<Step>("select");
  const [observationType, setObservationType] = useState<string>("");
  const [value, setValue] = useState<"yes" | "no" | "not_sure" | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selected = QUICK_OBSERVATION_OPTIONS.find((o) => o.id === observationType);

  async function submit() {
    setStep("submitting");
    setError(null);
    try {
      const res = await fetch(
        `/api/access/places/${encodeURIComponent(place.id)}/quick-observation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            observationType,
            value: value || undefined,
            note: note.trim() || undefined,
          }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not submit observation");
      }
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit observation");
      setStep("review");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-observation-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="quick-observation-title" className="text-xl font-black">
              Report a change
            </h2>
            <p className="mt-1 text-sm text-slate-600">{place.name}</p>
          </div>
          <button
            type="button"
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${mapableInteractiveFocusRing}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          Your report is evidence for review — not immediate verification. MapAble may show
          conflicting observations until reviewed.
        </p>

        {step === "select" ? (
          <fieldset className="mt-4 space-y-2">
            <legend className="text-sm font-semibold">Something changed?</legend>
            <ul className="mt-2 space-y-2">
              {QUICK_OBSERVATION_OPTIONS.map((option) => (
                <li key={option.id}>
                  <label
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 ${observationType === option.id ? "border-[#005B7F] bg-[#F6FBFC]" : "border-slate-200"} ${mapableInteractiveFocusRing}`}
                  >
                    <input
                      type="radio"
                      name="observationType"
                      value={option.id}
                      checked={observationType === option.id}
                      onChange={() => setObservationType(option.id)}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            {selected?.allowsYesNo ? (
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold">{selected.question}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["yes", "no", "not_sure"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${value === v ? "border-[#005B7F] bg-[#005B7F] text-white" : "border-slate-300"} ${mapableInteractiveFocusRing}`}
                      onClick={() => setValue(v)}
                    >
                      {v === "not_sure" ? "Not sure" : v === "yes" ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <button
              type="button"
              disabled={!observationType}
              className={`mt-4 min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white disabled:opacity-50 ${mapableInteractiveFocusRing}`}
              onClick={() => setStep("note")}
            >
              Continue
            </button>
          </fieldset>
        ) : null}

        {step === "note" ? (
          <div className="mt-4 space-y-3">
            <label htmlFor="observation-note" className="text-sm font-semibold">
              Optional note
            </label>
            <textarea
              id="observation-note"
              className={`min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm ${mapableInteractiveFocusRing}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              placeholder="What did you find?"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className={`min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold ${mapableInteractiveFocusRing}`}
                onClick={() => setStep("select")}
              >
                Back
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
                onClick={() => setStep("review")}
              >
                Review
              </button>
            </div>
          </div>
        ) : null}

        {step === "review" || step === "submitting" ? (
          <div className="mt-4 space-y-3">
            <dl className="rounded-xl border border-slate-200 p-3 text-sm">
              <div>
                <dt className="font-semibold">Observation</dt>
                <dd>{selected?.label}</dd>
              </div>
              {value ? (
                <div className="mt-2">
                  <dt className="font-semibold">Your answer</dt>
                  <dd>{value === "not_sure" ? "Not sure" : value}</dd>
                </div>
              ) : null}
              {note.trim() ? (
                <div className="mt-2">
                  <dt className="font-semibold">Note</dt>
                  <dd>{note.trim()}</dd>
                </div>
              ) : null}
            </dl>
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={step === "submitting"}
                className={`min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold ${mapableInteractiveFocusRing}`}
                onClick={() => setStep("note")}
              >
                Back
              </button>
              <button
                type="button"
                disabled={step === "submitting"}
                className={`min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white disabled:opacity-50 ${mapableInteractiveFocusRing}`}
                onClick={() => void submit()}
              >
                {step === "submitting" ? "Submitting…" : "Submit observation"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
