"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TripEvidenceForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const startedAt = new Date(`${fd.get("startDate")}T${fd.get("startTime")}`).toISOString();
    const completedAt = new Date(`${fd.get("endDate")}T${fd.get("endTime")}`).toISOString();

    const res = await fetch(`/api/transport-mvp/trips/${tripId}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startedAt,
        completedAt,
        distanceKm: Number(fd.get("distanceKm")),
        notes: fd.get("notes") || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save evidence");
      return;
    }
    router.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-4">
      <h2 className="font-heading text-lg font-semibold">Trip evidence</h2>
      <p className="text-sm text-muted-foreground">
        Record start/end times and distance before marking the trip complete.
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Start date
          <input type="date" name="startDate" defaultValue={today} required className="mt-1 min-h-11 w-full rounded-lg border px-2" />
        </label>
        <label className="text-sm">
          Start time
          <input type="time" name="startTime" defaultValue="09:00" required className="mt-1 min-h-11 w-full rounded-lg border px-2" />
        </label>
        <label className="text-sm">
          End date
          <input type="date" name="endDate" defaultValue={today} required className="mt-1 min-h-11 w-full rounded-lg border px-2" />
        </label>
        <label className="text-sm">
          End time
          <input type="time" name="endTime" defaultValue="10:00" required className="mt-1 min-h-11 w-full rounded-lg border px-2" />
        </label>
      </div>
      <label className="block text-sm">
        Distance (km)
        <input
          type="number"
          name="distanceKm"
          min="0.1"
          step="0.1"
          required
          className="mt-1 min-h-11 w-full rounded-lg border px-2"
        />
      </label>
      <label className="block text-sm">
        Notes
        <textarea name="notes" className="mt-1 min-h-20 w-full rounded-lg border px-2 py-2" />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground"
      >
        Save evidence
      </button>
    </form>
  );
}
