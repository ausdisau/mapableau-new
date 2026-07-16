"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ParticipantGoalCard } from "@/components/continuity-os/ParticipantGoalCard";
import { StopContinuityControl } from "@/components/continuity-os/StopContinuityControl";

type MissionPayload = {
  missionId: string;
  status: string;
  typeKey: string;
  typeVersion: string;
  participantGoal: string;
  participantWording: string;
  continuityStatus: string;
  unknowns: string[];
  templateWarnings: string[];
  prohibitedAutomatedDecisions: string[];
};

export default function LifeEventMissionPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const [missionId, setMissionId] = useState<string | null>(null);
  const [mission, setMission] = useState<MissionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMissionId(p.missionId));
  }, [params]);

  useEffect(() => {
    if (!missionId) return;
    void fetch(`/api/life-events/${missionId}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load mission");
        return body as MissionPayload;
      })
      .then(setMission)
      .catch((e: Error) => setError(e.message));
  }, [missionId]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      </main>
    );
  }

  if (!mission || !missionId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p>Loading life event…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/life-events" className="text-sky-800 underline">
          Life events
        </Link>
      </p>
      <h1 className="text-3xl font-bold text-slate-900">Life event mission</h1>
      <ParticipantGoalCard
        goal={mission.participantGoal}
        wording={mission.participantWording}
        typeKey={`${mission.typeKey} v${mission.typeVersion}`}
        status={mission.continuityStatus}
      />

      <nav aria-label="Life event sections">
        <ul className="flex flex-wrap gap-4 text-sm">
          <li>
            <Link
              className="text-sky-800 underline"
              href={`/life-events/${missionId}/dependencies`}
            >
              Dependencies
            </Link>
          </li>
          <li>
            <Link
              className="text-sky-800 underline"
              href={`/life-events/${missionId}/timeline`}
            >
              Timeline
            </Link>
          </li>
          <li>
            <Link
              className="text-sky-800 underline"
              href={`/life-events/${missionId}/resilience`}
            >
              Resilience check
            </Link>
          </li>
          <li>
            <Link className="text-sky-800 underline" href="/recovery">
              Recovery
            </Link>
          </li>
        </ul>
      </nav>

      <section aria-labelledby="unknowns-heading">
        <h2 id="unknowns-heading" className="text-lg font-semibold">
          Unknowns preserved
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {(mission.unknowns ?? []).map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="warnings-heading">
        <h2 id="warnings-heading" className="text-lg font-semibold">
          Warnings
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {(mission.templateWarnings ?? []).map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="prohibited-heading">
        <h2 id="prohibited-heading" className="text-lg font-semibold">
          Prohibited automated decisions
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {(mission.prohibitedAutomatedDecisions ?? []).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <StopContinuityControl missionId={missionId} />
    </main>
  );
}
