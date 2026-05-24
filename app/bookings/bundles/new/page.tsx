"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBundlePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createBundle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const date = String(form.get("date"));
    const time = String(form.get("time"));
    const journeyStart = new Date(`${date}T${time}`).toISOString();
    const res = await fetch("/api/bookings/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journeyStart, title: "My coordinated journey" }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("We could not create your bundle. Please try again.");
      return;
    }
    const data = await res.json();
    router.push(`/bookings/bundles/${data.bundle.id}`);
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Care + transport bundle</h1>
      <p className="text-muted-foreground">
        Plan preparation support, travel, appointment support and return travel in
        one timeline. A team member will confirm before dispatch.
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <form onSubmit={createBundle} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Journey date
          </label>
          <input id="date" name="date" type="date" required className="mt-1 min-h-11 w-full rounded border px-3" />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium">
            Start time
          </label>
          <input id="time" name="time" type="time" required className="mt-1 min-h-11 w-full rounded border px-3" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create bundle draft"}
        </button>
      </form>
    </main>
  );
}
