"use client";

import { useState } from "react";

export default function ProviderLearnersPage() {
  const [organisationId, setOrganisationId] = useState("");
  const [learners, setLearners] = useState<
    Array<{
      userId: string;
      name: string;
      email: string;
      enrolments: Array<{
        status: string;
        courseVersion: { title: string; versionNumber: number };
      }>;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch(
      `/api/academy/provider/learners?organisationId=${encodeURIComponent(organisationId)}`,
    );
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      learners?: typeof learners;
    } | null;
    if (!res.ok) {
      setError(data?.error ?? "Could not load learners.");
      return;
    }
    setLearners(data?.learners ?? []);
  }

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-teal-950">Learners</h1>
      <div className="flex flex-wrap gap-2">
        <label className="text-sm">
          Organisation ID
          <input
            className="ml-2 rounded border px-3 py-2"
            value={organisationId}
            onChange={(e) => setOrganisationId(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="rounded bg-teal-800 px-4 py-2 text-sm text-white"
        >
          Load
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {learners.map((l) => (
          <li key={l.userId} className="border-b pb-2 text-sm">
            <p className="font-medium">
              {l.name} · {l.email}
            </p>
            <ul className="list-disc pl-5 text-slate-600">
              {l.enrolments.map((e, i) => (
                <li key={i}>
                  {e.courseVersion.title} v{e.courseVersion.versionNumber} — {e.status}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </article>
  );
}
