"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function RecoveryOutcomePage() {
  const params = useParams<{ recoveryId: string }>();
  const [summary, setSummary] = useState("");
  const [state, setState] = useState("partially_restored");
  const [falseRecovery, setFalseRecovery] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/recovery/cases/${params.recoveryId}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, summary, falseRecovery }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message ?? data.error);
      return;
    }
    setMessage("Outcome and receipt recorded.");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link href={`/recovery/${params.recoveryId}`} className="underline">
          Back
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Outcome review</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-sm">
          Outcome state
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="partially_restored">partially_restored</option>
            <option value="restored">restored</option>
            <option value="restored_with_conditions">restored_with_conditions</option>
            <option value="not_restored">not_restored</option>
            <option value="outcome_unknown">outcome_unknown</option>
            <option value="human_review_required">human_review_required</option>
          </select>
        </label>
        <label className="block text-sm">
          Summary
          <textarea
            required
            className="mt-1 w-full rounded border px-3 py-2"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={falseRecovery}
            onChange={(e) => setFalseRecovery(e.target.checked)}
          />
          Mark as false recovery (reopens case)
        </label>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Record outcome
        </button>
      </form>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </main>
  );
}
