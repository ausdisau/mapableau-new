"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReceiptRow = {
  id: string;
  outcome: string;
  falseRecovery: boolean;
  receipt: {
    originalGoal: string;
    failure: string;
    optionSelected: string;
    serviceActionCompleted: boolean;
    realWorldOutcomeConfirmed: boolean;
    participantGoalAchieved: boolean;
    limitations: string[];
    remainingUnknowns: string[];
  };
  createdAt: string;
};

export default function RecoveryReceiptsPage({
  params,
}: {
  params: Promise<{ recoveryId: string }>;
}) {
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setRecoveryId(p.recoveryId));
  }, [params]);

  useEffect(() => {
    if (!recoveryId) return;
    void fetch(`/api/recovery/cases/${recoveryId}/receipt`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load receipts");
        return body as { receipts: ReceiptRow[] };
      })
      .then((data) => setReceipts(data.receipts))
      .catch((e: Error) => setError(e.message));
  }, [recoveryId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link
          href={recoveryId ? `/recovery/${recoveryId}` : "/recovery"}
          className="text-sky-800 underline"
        >
          Back to recovery
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        Recovery receipts
      </h1>
      <p className="mt-2 text-sm text-slate-700">
        Distinguishes service action completed, real-world outcome confirmed,
        and participant goal achieved.
      </p>
      {error ? (
        <p className="mt-4 text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-4">
        {receipts.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h2 className="font-semibold text-slate-900">
              Outcome: {r.outcome}
              {r.falseRecovery ? " · false recovery flagged" : ""}
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              Goal: {r.receipt.originalGoal}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Failure: {r.receipt.failure}
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
              <li>
                Service action completed:{" "}
                <strong>
                  {r.receipt.serviceActionCompleted ? "yes" : "no"}
                </strong>
              </li>
              <li>
                Real-world outcome confirmed:{" "}
                <strong>
                  {r.receipt.realWorldOutcomeConfirmed ? "yes" : "no"}
                </strong>
              </li>
              <li>
                Participant goal achieved:{" "}
                <strong>
                  {r.receipt.participantGoalAchieved ? "yes" : "no"}
                </strong>
              </li>
            </ul>
            {r.receipt.limitations?.length ? (
              <ul className="mt-3 list-disc pl-5 text-sm text-amber-900">
                {r.receipt.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
        {receipts.length === 0 && !error ? (
          <li className="text-sm text-slate-600">No receipts yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
