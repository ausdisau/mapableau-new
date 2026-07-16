"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Milestone = {
  key: string;
  label: string;
  horizon: string;
  ownerRole: string;
  status: string;
  missingDependencies: string[];
  evidenceRequired: boolean;
};

export default function TimelinePage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const [missionId, setMissionId] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMissionId(p.missionId));
  }, [params]);

  useEffect(() => {
    if (!missionId) return;
    void fetch(`/api/life-events/${missionId}/timeline`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load timeline");
        return body as { milestones: Milestone[] };
      })
      .then((data) => setMilestones(data.milestones))
      .catch((e: Error) => setError(e.message));
  }, [missionId]);

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
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Timeline</h1>
      <p className="mt-2 text-sm text-slate-600">
        Accessible list timeline. A model cannot declare completion without
        evidence.
      </p>
      {error ? (
        <p className="mt-4 text-rose-700" role="alert">
          {error}
        </p>
      ) : (
        <ol className="mt-6 space-y-3">
          {milestones.map((m) => (
            <li
              key={m.key}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <h2 className="font-semibold text-slate-900">{m.label}</h2>
              <p className="mt-1 text-sm text-slate-700">
                Status: <strong>{m.status}</strong> · Horizon: {m.horizon} ·
                Owner: {m.ownerRole}
              </p>
              {m.missingDependencies.length > 0 ? (
                <p className="mt-2 text-sm text-amber-800">
                  Missing or unconfirmed: {m.missingDependencies.join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
