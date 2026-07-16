"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function LifeEventResiliencePage() {
  const params = useParams<{ missionId: string }>();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/life-events/${params.missionId}/resilience`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error);
        return;
      }
      setResult(data);
    } finally {
      setBusy(false);
    }
  }

  const assessment = result?.assessment as
    | {
        level: string;
        singlePointsOfFailureJson: string[];
        unconfirmedJson: string[];
        timingConflictsJson: string[];
        humanReviewNeedsJson: string[];
        participantActionsJson: string[];
        nonAiContactsJson: string[];
      }
    | undefined;

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <p className="text-sm">
        <Link href={`/life-events/${params.missionId}`} className="underline">
          Back to mission
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Resilience and pre-mortem</h1>
      <p className="text-sm text-slate-700">
        Describes service and environment dependencies only — never participant
        capability, independence or worthiness.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Assessing…" : "Run pre-mortem"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {assessment ? (
        <section className="space-y-3 rounded border border-slate-200 bg-white p-4">
          <p>
            Level: <strong>{assessment.level}</strong>
          </p>
          <p className="text-sm text-slate-600">{String(result?.disclaimer ?? "")}</p>
          <div>
            <h2 className="font-medium">Single points of failure</h2>
            <ul className="list-disc pl-5 text-sm">
              {assessment.singlePointsOfFailureJson.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-medium">Participant actions</h2>
            <ul className="list-disc pl-5 text-sm">
              {assessment.participantActionsJson.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-medium">Non-AI contacts</h2>
            <ul className="list-disc pl-5 text-sm">
              {assessment.nonAiContactsJson.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
