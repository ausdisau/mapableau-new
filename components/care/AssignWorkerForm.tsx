"use client";

import { useState } from "react";

export function AssignWorkerForm({ bookingId }: { bookingId: string }) {
  const [workerProfileId, setWorkerProfileId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/care/bookings/${bookingId}/assign-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerProfileId }),
    });
    setMessage(res.ok ? "Worker assigned" : "Unable to assign worker");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
      <label className="block text-sm font-medium" htmlFor="workerProfileId">
        Worker profile ID
      </label>
      <input
        id="workerProfileId"
        className="w-full rounded-lg border p-3"
        value={workerProfileId}
        onChange={(event) => setWorkerProfileId(event.target.value)}
      />
      <button className="rounded-lg bg-primary px-4 py-3 text-primary-foreground" type="submit">
        Assign worker
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function AssignWorkerForm({
  bookingId,
  workers,
}: {
  bookingId: string;
  workers: Array<{ id: string; displayName: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-xl border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const response = await fetch(`/api/care/bookings/${bookingId}/assign-worker`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerProfileId: form.get("workerProfileId"),
            notes: form.get("notes") || undefined,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? "Could not assign worker");
          return;
        }
        router.refresh();
      }}
    >
      <h2 className="font-semibold">Assign worker</h2>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <select name="workerProfileId" className={formInputClass} required>
        <option value="">Select a worker</option>
        {workers.map((worker) => (
          <option key={worker.id} value={worker.id}>
            {worker.displayName}
          </option>
        ))}
      </select>
      <input name="notes" className={formInputClass} placeholder="Assignment notes" />
      <Button type="submit" variant="default" size="default">
        Assign worker
      </Button>
    </form>
  );
}
