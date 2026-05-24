"use client";

import { useEffect, useState } from "react";

type Preference = {
  id: string;
  workerUserId: string;
  notes: string | null;
};

export function PreferredWorkersPanel() {
  const [preferred, setPreferred] = useState<Preference[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/participant/preferred-workers")
      .then((r) => r.json())
      .then((d) => setPreferred(d.preferences ?? []))
      .catch(() => setError("Could not load preferred workers."));
  }, []);

  async function addPreferred(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/participant/preferred-workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerUserId: workerId }),
    });
    if (!res.ok) {
      setError("Could not save preference.");
      return;
    }
    const data = await res.json();
    setPreferred((p) => [...p, data.preference]);
    setWorkerId("");
  }

  return (
    <section aria-labelledby="preferred-workers-heading">
      <h2 id="preferred-workers-heading" className="font-heading text-lg font-semibold">
        Preferred support workers
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Workers you prefer can be suggested first when you request care. You can change
        this at any time.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {preferred.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No preferred workers yet. Add one when you know who you would like to see
            again.
          </li>
        ) : (
          preferred.map((p) => (
            <li key={p.id} className="rounded border p-2 text-sm">
              Worker reference saved
              {p.notes ? ` — ${p.notes}` : ""}
            </li>
          ))
        )}
      </ul>
      <form onSubmit={addPreferred} className="mt-4 space-y-2">
        <label htmlFor="worker-id" className="block text-sm font-medium">
          Add preferred worker (ID from your provider)
        </label>
        <input
          id="worker-id"
          className="min-h-11 w-full rounded border px-3"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
        />
        <button
          type="submit"
          className="min-h-11 rounded bg-primary px-4 text-primary-foreground"
        >
          Save preference
        </button>
      </form>
    </section>
  );
}
