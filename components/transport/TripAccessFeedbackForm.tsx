"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TripAccessFeedbackForm({
  tripId,
  placeId,
}: {
  tripId: string;
  placeId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-sm text-green-700" role="status">
        Thank you — your feedback helps improve the map for others.
      </p>
    );
  }

  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      aria-labelledby="trip-feedback-heading"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/access-transport/trip-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId,
            placeId,
            dropoffAccessible:
              fd.get("dropoffAccessible") === "yes"
                ? true
                : fd.get("dropoffAccessible") === "no"
                  ? false
                  : undefined,
            entranceCorrect:
              fd.get("entranceCorrect") === "yes"
                ? true
                : fd.get("entranceCorrect") === "no"
                  ? false
                  : undefined,
            barriersNotes: String(fd.get("barriersNotes") ?? "") || undefined,
            createAlert: fd.get("createAlert") === "on",
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(typeof j.error === "string" ? j.error : "Could not submit");
          return;
        }
        setDone(true);
        router.refresh();
      }}
    >
      <h2 id="trip-feedback-heading" className="font-semibold">
        Help improve access information
      </h2>
      <p className="text-sm text-muted-foreground">
        Was the destination information still accurate after your trip?
      </p>

      <fieldset>
        <legend className="text-sm font-medium">Was the drop-off accessible?</legend>
        <label className="mr-4 inline-flex min-h-11 items-center gap-2">
          <input type="radio" name="dropoffAccessible" value="yes" /> Yes
        </label>
        <label className="inline-flex min-h-11 items-center gap-2">
          <input type="radio" name="dropoffAccessible" value="no" /> No
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Was the entrance information correct?</legend>
        <label className="mr-4 inline-flex min-h-11 items-center gap-2">
          <input type="radio" name="entranceCorrect" value="yes" /> Yes
        </label>
        <label className="inline-flex min-h-11 items-center gap-2">
          <input type="radio" name="entranceCorrect" value="no" /> No
        </label>
      </fieldset>

      <label className="block text-sm">
        Barriers or notes (optional)
        <textarea
          name="barriersNotes"
          rows={3}
          className="mt-1 block w-full rounded border px-3 py-2"
          placeholder="Describe any barriers you noticed…"
        />
      </label>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="createAlert" />
        Create an access alert from this feedback
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
      >
        Submit feedback
      </button>
    </form>
  );
}
