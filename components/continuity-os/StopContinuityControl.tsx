"use client";

import { useState } from "react";

type Props = {
  missionId: string;
  onStopped?: () => void;
};

export function StopContinuityControl({ missionId, onStopped }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function stop() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/life-events/${missionId}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "participant_stop" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.message ?? "Could not stop ContinuityOS.");
        return;
      }
      setMessage("Stopped. Active ContinuityOS work for this mission is halted.");
      onStopped?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="stop-continuity-heading"
      className="rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <h2 id="stop-continuity-heading" className="text-base font-semibold text-red-900">
        Stop ContinuityOS
      </h2>
      <p className="mt-1 text-sm text-red-800">
        Easy to find. Stops recovery preparation for this mission. Essential help and
        human escalation remain available.
      </p>
      <button
        type="button"
        onClick={stop}
        disabled={busy}
        className="mt-3 rounded bg-red-800 px-3 py-2 text-sm font-medium text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-red-900 disabled:opacity-60"
      >
        {busy ? "Stopping…" : "Stop"}
      </button>
      {message ? <p className="mt-2 text-sm text-red-900">{message}</p> : null}
    </section>
  );
}
