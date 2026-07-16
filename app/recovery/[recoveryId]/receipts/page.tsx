"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecoveryReceiptsPage() {
  const params = useParams<{ recoveryId: string }>();
  const [receipts, setReceipts] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/recovery/cases/${params.recoveryId}/receipt`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.message ?? data.error);
        else setReceipts(data.receipts ?? []);
      })
      .catch(() => setError("Could not load receipts."));
  }, [params.recoveryId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link href={`/recovery/${params.recoveryId}`} className="underline">
          Back
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Recovery receipts</h1>
      <p className="mt-2 text-sm text-slate-700">
        Distinguishes service action completed, real-world outcome confirmed, and
        participant goal achieved.
      </p>
      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
      <pre className="mt-4 overflow-auto rounded border bg-slate-50 p-3 text-xs">
        {JSON.stringify(receipts, null, 2)}
      </pre>
    </main>
  );
}
