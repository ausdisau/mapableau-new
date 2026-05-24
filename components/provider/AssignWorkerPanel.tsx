"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AssignWorkerPanel({
  bookingId,
  workers,
}: {
  bookingId: string;
  workers: { userId: string; name: string }[];
}) {
  const [workerUserId, setWorkerUserId] = useState(workers[0]?.userId ?? "");
  const [message, setMessage] = useState("");

  async function assign() {
    const res = await fetch(`/api/bookings/${bookingId}/assign-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerUserId }),
    });
    setMessage(res.ok ? "Worker assigned." : "Could not assign worker.");
    if (res.ok) window.location.reload();
  }

  return (
    <section className="rounded-lg border p-4" aria-labelledby="assign-worker">
      <h2 id="assign-worker" className="font-semibold">
        Assign worker
      </h2>
      <label className="mt-2 block text-sm">
        Worker
        <select
          className="mt-1 w-full rounded border p-2"
          value={workerUserId}
          onChange={(e) => setWorkerUserId(e.target.value)}
        >
          {workers.map((w) => (
            <option key={w.userId} value={w.userId}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" variant="default" size="default" className="mt-3" onClick={assign}>
        Assign
      </Button>
      {message && (
        <p className="mt-2 text-sm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
