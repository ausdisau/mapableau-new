"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LifeEventTypeOption = {
  typeKey: string;
  category: string;
  version: string;
  plainLanguageDescription: string;
  requiredWarnings: string[];
};

export default function NewLifeEventPage() {
  const router = useRouter();
  const [types, setTypes] = useState<LifeEventTypeOption[]>([]);
  const [typeKey, setTypeKey] = useState("start_job");
  const [goal, setGoal] = useState("");
  const [wording, setWording] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/life-events/types")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Life events are not available");
        }
        return res.json() as Promise<{ types: LifeEventTypeOption[] }>;
      })
      .then((data) => {
        setTypes(data.types);
        if (data.types[0]) setTypeKey(data.types[0].typeKey);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const selected = types.find((t) => t.typeKey === typeKey);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/life-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeKey,
          participantGoal: goal,
          participantWording: wording || goal,
          preservedUnknowns: ["reception_assistance"],
          preferences: {
            preserveOriginalAppointment: true,
            avoidUnfamiliarWorkers: true,
            preferHumanCoordinator: true,
            minimiseAdditionalDisclosure: true,
            contactSupporterOnlyAfterAsking: true,
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not create life event");
      router.push(`/life-events/${body.missionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm">
        <Link href="/life-events" className="text-sky-800 underline">
          Back to life events
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">New life event</h1>
      <p className="mt-2 text-slate-700">
        Templates are starting points. They never presume every person needs the
        same steps. No bookings are made from this screen.
      </p>

      {loadError ? (
        <p className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          {loadError}
        </p>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={(e) => void submit(e)}>
          <fieldset>
            <legend className="text-base font-semibold text-slate-900">
              Life event type
            </legend>
            <div className="mt-3 space-y-3">
              {types.map((t) => (
                <label
                  key={t.typeKey}
                  className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <input
                    type="radio"
                    name="typeKey"
                    value={t.typeKey}
                    checked={typeKey === t.typeKey}
                    onChange={() => setTypeKey(t.typeKey)}
                  />
                  <span>
                    <span className="block font-medium text-slate-900">
                      {t.typeKey}
                    </span>
                    <span className="block text-sm text-slate-600">
                      {t.plainLanguageDescription}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {selected ? (
            <aside className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">Warnings</p>
              <ul className="mt-1 list-disc pl-5">
                {selected.requiredWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </aside>
          ) : null}

          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-slate-900">
              Your goal
            </label>
            <input
              id="goal"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Start my job at Harbour Civic Centre on time"
            />
          </div>

          <div>
            <label htmlFor="wording" className="block text-sm font-medium text-slate-900">
              In your words (optional)
            </label>
            <textarea
              id="wording"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              rows={3}
              value={wording}
              onChange={(e) => setWording(e.target.value)}
            />
          </div>

          {error ? (
            <p className="text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || !goal.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create draft life event"}
          </button>
        </form>
      )}
    </main>
  );
}
