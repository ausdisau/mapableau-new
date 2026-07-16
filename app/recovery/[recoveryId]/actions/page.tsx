"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecoveryActionsPage() {
  const params = useParams<{ recoveryId: string }>();
  const [actions, setActions] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/recovery/cases/${params.recoveryId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.message ?? data.error);
        else setActions(data.recoveryCase?.actionLinks ?? []);
      })
      .catch(() => setError("Could not load actions."));
  }, [params.recoveryId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link href={`/recovery/${params.recoveryId}`} className="underline">
          Back
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Recovery actions</h1>
      <p className="mt-2 text-sm text-slate-700">
        Queued is not executed. Request created is not ride confirmed.
      </p>
      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
      <pre className="mt-4 overflow-auto rounded border bg-slate-50 p-3 text-xs">
        {JSON.stringify(actions, null, 2)}
      </pre>
    </main>
  );
}
