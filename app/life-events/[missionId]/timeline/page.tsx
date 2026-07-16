"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Milestone = {
  id: string;
  code: string;
  label: string;
  status: string;
  ownerRole: string;
  dueAt?: string | null;
};

export default function LifeEventTimelinePage() {
  const params = useParams<{ missionId: string }>();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/life-events/${params.missionId}/timeline`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.message ?? data.error);
        else setMilestones(data.milestones ?? []);
      })
      .catch(() => setError("Could not load timeline."));
  }, [params.missionId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link href={`/life-events/${params.missionId}`} className="underline">
          Back to mission
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Timeline and milestones</h1>
      <p className="mt-2 text-sm text-slate-700">
        Completion requires evidence. Models may explain status only.
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <ol className="mt-6 space-y-3">
        {milestones.map((m, index) => (
          <li key={m.id} className="rounded border border-slate-200 bg-white p-3">
            <p className="font-medium">
              {index + 1}. {m.label}
            </p>
            <p className="text-sm text-slate-700">
              Status: <strong>{m.status}</strong> · Owner: {m.ownerRole}
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
