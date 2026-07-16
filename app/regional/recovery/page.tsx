"use client";

import { useState } from "react";

export default function RegionalRecoveryPage() {
  const [options, setOptions] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setError(null);
    const res = await fetch("/api/regional/recovery?need=transport&need=care");
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? data.error);
      return;
    }
    setOptions(data.options ?? []);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Regional recovery</h1>
      <p className="mt-2 text-slate-700">
        Mutual-aid style options remain participant-approved, provider-confirmed,
        credential-checked and time-limited. No automatic assignment.
      </p>
      <button
        type="button"
        onClick={search}
        className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm text-white"
      >
        Search regional options
      </button>
      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
      <pre className="mt-4 overflow-auto rounded border bg-slate-50 p-3 text-xs">
        {JSON.stringify(options, null, 2)}
      </pre>
    </main>
  );
}
