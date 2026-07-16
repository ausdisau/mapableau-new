"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecoveryPayload = {
  recoveryId: string;
  missionId: string;
  status: string;
  playbookKey: string;
  shadowOnly: boolean;
  selectedOptionId: string | null;
  ownerRole: string;
  failure: {
    failureClass: string | null;
    severity: string | null;
    rawSummary: string;
    verificationStatus: string;
    affectedDependencyId: string | null;
  };
  note: string;
};

export default function RecoveryDetailPage({
  params,
}: {
  params: Promise<{ recoveryId: string }>;
}) {
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [data, setData] = useState<RecoveryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setRecoveryId(p.recoveryId));
  }, [params]);

  useEffect(() => {
    if (!recoveryId) return;
    void fetch(`/api/recovery/cases/${recoveryId}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load recovery");
        return body as RecoveryPayload;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [recoveryId]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      </main>
    );
  }

  if (!data || !recoveryId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p>Loading recovery…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/recovery" className="text-sky-800 underline">
          Recovery
        </Link>
      </p>
      <h1 className="text-3xl font-bold text-slate-900">Recovery case</h1>
      <p className="text-slate-700">{data.note}</p>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Service failure</h2>
        <p className="mt-2 text-slate-800">{data.failure.rawSummary}</p>
        <dl className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
          <dt className="font-medium">Class</dt>
          <dd>{data.failure.failureClass ?? "unknown"}</dd>
          <dt className="font-medium">Severity</dt>
          <dd>{data.failure.severity ?? "unknown"}</dd>
          <dt className="font-medium">Verification</dt>
          <dd>{data.failure.verificationStatus}</dd>
          <dt className="font-medium">Affected dependency</dt>
          <dd>{data.failure.affectedDependencyId ?? "unknown"}</dd>
          <dt className="font-medium">Playbook</dt>
          <dd>{data.playbookKey}</dd>
          <dt className="font-medium">Mode</dt>
          <dd>{data.shadowOnly ? "shadow (no service execution)" : data.status}</dd>
        </dl>
      </section>

      <nav aria-label="Recovery sections">
        <ul className="flex flex-wrap gap-4 text-sm">
          <li>
            <Link
              className="text-sky-800 underline"
              href={`/recovery/${recoveryId}/options`}
            >
              Options
            </Link>
          </li>
          <li>
            <Link
              className="text-sky-800 underline"
              href={`/recovery/${recoveryId}/receipts`}
            >
              Receipts
            </Link>
          </li>
          <li>
            <Link
              className="text-sky-800 underline"
              href={`/life-events/${data.missionId}`}
            >
              Life event mission
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
