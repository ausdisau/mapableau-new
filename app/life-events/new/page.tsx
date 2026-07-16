"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LifeEventType = {
  code: string;
  category: string;
  version: string;
  title: string;
  plainLanguageDescription: string;
};

export default function NewLifeEventPage() {
  const router = useRouter();
  const [types, setTypes] = useState<LifeEventType[]>([]);
  const [code, setCode] = useState("start_job");
  const [goal, setGoal] = useState("");
  const [wording, setWording] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/life-events/types")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? "Life events are not enabled.");
          return;
        }
        const data = await res.json();
        setTypes(data.types ?? []);
      })
      .catch(() => setError("Could not load life-event types."));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/life-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lifeEventTypeCode: code,
          participantGoal: goal,
          participantWording: wording || goal,
          activate: true,
          unknowns: code === "start_job" ? ["reception_or_first_day_assistance"] : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Could not create life event.");
        return;
      }
      router.push(`/life-events/${data.mission.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm">
        <Link href="/life-events" className="underline">
          Back to life events
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">New life event</h1>
      <p className="mt-2 text-slate-700">
        Templates are starting points only. You decide what applies. No automatic
        bookings.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="life-event-type" className="block text-sm font-medium">
            Life event type
          </label>
          <select
            id="life-event-type"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            {(types.length ? types : [{ code: "start_job", title: "Starting a job" }]).map(
              (t) => (
                <option key={t.code} value={t.code}>
                  {t.title}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <label htmlFor="goal" className="block text-sm font-medium">
            Your goal
          </label>
          <textarea
            id="goal"
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Example: Start my job at Harbour Civic Centre with the supports I need."
          />
        </div>
        <div>
          <label htmlFor="wording" className="block text-sm font-medium">
            In your words (optional)
          </label>
          <textarea
            id="wording"
            value={wording}
            onChange={(e) => setWording(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create life-event mission"}
        </button>
      </form>
    </main>
  );
}
