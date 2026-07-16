"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Finding = {
  code: string;
  severity: string;
  title: string;
  explanation: string;
  participantActions: string[];
  nonAiContacts: string[];
};

export default function ResiliencePage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const [missionId, setMissionId] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [spoFs, setSpoFs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void params.then((p) => setMissionId(p.missionId));
  }, [params]);

  async function run() {
    if (!missionId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/life-events/${missionId}/resilience`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Resilience check failed");
      setFindings(body.assessment.findings ?? []);
      setSpoFs(body.assessment.singlePointsOfFailure ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link
          href={missionId ? `/life-events/${missionId}` : "/life-events"}
          className="text-sky-800 underline"
        >
          Back to mission
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        Resilience check
      </h1>
      <p className="mt-2 text-slate-700">
        Deterministic pre-mortem. No participant behaviour prediction. No risk
        score. No live monitoring.
      </p>
      <button
        type="button"
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={busy || !missionId}
        onClick={() => void run()}
      >
        {busy ? "Checking…" : "Run resilience check"}
      </button>
      {error ? (
        <p className="mt-4 text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {spoFs.length > 0 ? (
        <p className="mt-4 text-sm text-slate-700">
          Single points of failure: <strong>{spoFs.join(", ")}</strong>
        </p>
      ) : null}
      <ul className="mt-6 space-y-3">
        {findings.map((f) => (
          <li
            key={`${f.code}-${f.title}`}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h2 className="font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Severity: {f.severity}
            </p>
            <p className="mt-2 text-sm text-slate-700">{f.explanation}</p>
            <p className="mt-2 text-sm text-slate-700">
              Your actions: {f.participantActions.join("; ")}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Non-AI contacts: {f.nonAiContacts.join("; ")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
