"use client";

import { useState } from "react";

export function StopContinuityControl(props: { missionId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function stop() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/life-events/${props.missionId}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "participant_stop" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not stop");
      setMessage(
        body.alreadyStopped
          ? "Already stopped."
          : "Stopped. ContinuityOS will not continue this workflow."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stop failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="stop-continuity-heading"
      className="rounded-lg border-2 border-rose-300 bg-rose-50 p-4"
    >
      <h2 id="stop-continuity-heading" className="text-lg font-semibold text-rose-900">
        Stop
      </h2>
      <p className="mt-1 text-sm text-rose-900">
        Stop ContinuityOS for this life event. This is always available and is
        not paywalled.
      </p>
      <button
        type="button"
        className="mt-3 rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        onClick={() => void stop()}
        disabled={busy}
      >
        {busy ? "Stopping…" : "Stop ContinuityOS"}
      </button>
      {message ? (
        <p className="mt-2 text-sm text-rose-900" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
