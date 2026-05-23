"use client";

import { useCallback, useState } from "react";

type Step = "service" | "locations" | "time" | "review";

const STEPS: Step[] = ["service", "locations", "time", "review"];

export function SchedulingBookingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [serviceType, setServiceType] = useState<
    "care" | "transport" | "care_transport"
  >("transport");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [requestedStart, setRequestedStart] = useState("");
  const [participantNotes, setParticipantNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[stepIndex];

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/scheduling/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          pickupLocationId: pickupLocationId || undefined,
          dropoffLocationId: dropoffLocationId || undefined,
          requestedStart: new Date(requestedStart).toISOString(),
          participantNotes: participantNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResultId(data.booking?.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [
    serviceType,
    pickupLocationId,
    dropoffLocationId,
    requestedStart,
    participantNotes,
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Step {stepIndex + 1} of {STEPS.length}: {step}
      </p>

      {step === "service" && (
        <fieldset className="space-y-3">
          <legend className="font-medium">Service type</legend>
          {(
            [
              ["care", "Care support"],
              ["transport", "Transport"],
              ["care_transport", "Care + transport bundle"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="serviceType"
                value={value}
                checked={serviceType === value}
                onChange={() => setServiceType(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      {step === "locations" && (
        <div className="space-y-4">
          <p className="text-sm">
            Use saved private locations (no home address sent to external maps).
          </p>
          <label className="block">
            <span className="text-sm font-medium">Pickup location ID</span>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={pickupLocationId}
              onChange={(e) => setPickupLocationId(e.target.value)}
              required={serviceType !== "care"}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Drop-off location ID</span>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={dropoffLocationId}
              onChange={(e) => setDropoffLocationId(e.target.value)}
              required={serviceType !== "care"}
            />
          </label>
        </div>
      )}

      {step === "time" && (
        <label className="block">
          <span className="text-sm font-medium">Preferred start</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border px-3 py-2"
            value={requestedStart}
            onChange={(e) => setRequestedStart(e.target.value)}
            required
          />
        </label>
      )}

      {step === "review" && (
        <div className="space-y-2 text-sm">
          <p>Service: {serviceType.replace("_", " ")}</p>
          <p>Start: {requestedStart || "—"}</p>
          {participantNotes && <p>Notes: {participantNotes}</p>}
          <label className="block">
            <span className="font-medium">Notes (optional)</span>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2"
              rows={3}
              value={participantNotes}
              onChange={(e) => setParticipantNotes(e.target.value)}
            />
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {resultId && (
        <p className="text-sm text-green-700" role="status">
          Booking created: {resultId}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          className="rounded border px-4 py-2"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>
        {stepIndex < STEPS.length - 1 ? (
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        )}
      </div>
    </div>
  );
}
