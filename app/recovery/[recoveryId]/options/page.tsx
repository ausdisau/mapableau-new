"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RecoveryOptionCard } from "@/components/continuity-os/RecoveryOptionCard";
import type { RecoveryOptionView } from "@/lib/continuity-os/types";

export default function RecoveryOptionsPage({
  params,
}: {
  params: Promise<{ recoveryId: string }>;
}) {
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [options, setOptions] = useState<RecoveryOptionView[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void params.then((p) => setRecoveryId(p.recoveryId));
  }, [params]);

  useEffect(() => {
    if (!recoveryId) return;
    void fetch(`/api/recovery/cases/${recoveryId}/options`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load options");
        return body as { options: RecoveryOptionView[] };
      })
      .then((data) => setOptions(data.options))
      .catch((e: Error) => setError(e.message));
  }, [recoveryId]);

  async function selectOption(optionId: string) {
    if (!recoveryId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/recovery/cases/${recoveryId}/select-option`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not select option");
      setSelected(optionId);

      const proposalRes = await fetch(
        `/api/recovery/cases/${recoveryId}/prepare-proposal`,
        { method: "POST" }
      );
      const proposalBody = await proposalRes.json().catch(() => ({}));
      if (!proposalRes.ok) {
        throw new Error(proposalBody.error ?? "Could not prepare proposal");
      }
      setMessage(
        "Option selected and proposal prepared. Request created is not ride confirmed. Fresh approval still required before any service write."
      );
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
          href={recoveryId ? `/recovery/${recoveryId}` : "/recovery"}
          className="text-sky-800 underline"
        >
          Back to recovery
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        Recovery options
      </h1>
      <p className="mt-2 text-sm text-slate-700">
        Compare options. Hard requirement failures are excluded. Cost must be
        visible before you approve.
      </p>
      {error ? (
        <p className="mt-4 text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        {options.map((option) => (
          <RecoveryOptionCard
            key={option.id}
            option={option}
            selected={selected === option.id}
            disabled={busy}
            onSelect={(id) => void selectOption(id)}
          />
        ))}
      </div>
    </main>
  );
}
