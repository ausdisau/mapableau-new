"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Brief = {
  title: string;
  humanGoal: string;
  fictionalNotice: string;
  visitAt?: string;
  requirements: Array<{ featureType: string; importance: string; value: unknown }>;
  evidenceCatalog: Array<{
    id: string;
    title: string;
    sourceType: string;
    status: string;
    capturedAt: string;
  }>;
};

type Session = {
  id: string;
  stage: string;
  prediction?: { status: string; confidence: number };
  inspectedEvidenceIds: string[];
  selectedEntranceId?: string;
  selectedRouteId?: string;
  identifiedBlockers: string[];
  identifiedUnknowns: string[];
  teachBackText?: string;
  reflections: string[];
  transferAnswer?: string;
  hintLevel: number;
  mainLiftOutageIntroduced: boolean;
  engineDecision?: { status: string; unknowns: string[]; blockers: string[] };
  revisedDecision?: { status: string; alternatives: string[] };
};

type CompletePayload = {
  session: Session;
  eveningDecision?: { status: string; conditions: string[] };
  mirror?: {
    narratableFindings: string[];
    evidenceInspectedCount: number;
    unknownTreatedAsPresent: boolean;
    hardRequirementOverlooked: boolean;
    initialPrediction: string | null;
    finalDecision: string | null;
  };
  rubric?: {
    overallLevel: string;
    strengths: string[];
    nextFocus: string[];
    criteria: Array<{ criterionId: string; status: string; explanation: string }>;
  };
};

const STAGES = [
  "orientation",
  "prediction",
  "investigation",
  "decision",
  "consequence",
  "revision",
  "teach_back",
  "reflection",
  "transfer",
  "complete",
] as const;

async function postAction(body: Record<string, unknown>) {
  const res = await fetch("/api/access-intelligence/scenarios/interview-level-3", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Flight sim action failed");
  return data as CompletePayload & { session?: Session; level?: number; text?: string };
}

export function InterviewFlightSimClient() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [complete, setComplete] = useState<CompletePayload | null>(null);

  const [predStatus, setPredStatus] = useState("suitable_with_conditions");
  const [predConf, setPredConf] = useState(60);
  const [entranceId, setEntranceId] = useState("n-hcc-b");
  const [routeId, setRouteId] = useState("route-main-lift");
  const [blockers, setBlockers] = useState("");
  const [unknowns, setUnknowns] = useState("toilet ops; reception assistance");
  const [teachBack, setTeachBack] = useState(
    "Use Entrance B (level), avoid Entrance A (steps), then the western lift after the main-lift outage. Accessible toilet is on level 2 — ops unknown. Reception assistance unresolved.",
  );
  const [reflections, setReflections] = useState(
    "I assumed the main lift would stay available.\nDoor width evidence changed the entrance choice.\nToilet ops remain unknown.\nShare step-free needs only.\nConfirm toilet status before visit.",
  );
  const [transferAnswer, setTransferAnswer] =
    useState("Entrance B closed at 7pm — special access or incomplete information.");

  useEffect(() => {
    void fetch("/api/access-intelligence/scenarios/interview-level-3")
      .then((r) => r.json())
      .then((data) => setBrief(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load brief"));
  }, []);

  async function start() {
    try {
      setError(null);
      setComplete(null);
      const data = await postAction({ action: "start" });
      setSession(data.session!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Start failed");
    }
  }

  async function run(body: Record<string, unknown>) {
    try {
      setError(null);
      const data = await postAction(body);
      if (data.session) setSession(data.session);
      if (data.mirror || data.rubric) setComplete(data);
      if (data.text) setHint(`Hint ${data.level}: ${data.text}`);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return null;
    }
  }

  const stage = session?.stage ?? "orientation";
  const stageIndex = STAGES.indexOf(stage as (typeof STAGES)[number]);

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        {brief?.fictionalNotice ??
          "Harbour Civic Centre is fictional. Do not treat measurements as a real venue."}
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/access-intelligence/buildings/place-harbour-civic#visit"
          className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
        >
          Exit to Visit mode
        </Link>
        <Link
          href="/access-intelligence/learn"
          className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
        >
          Learning Lab catalogue
        </Link>
      </div>

      <section aria-labelledby="brief-heading">
        <h2 id="brief-heading" className="text-2xl font-black">
          {brief?.title ?? "The Interview on Level 3"}
        </h2>
        <p className="mt-2 text-slate-700">{brief?.humanGoal}</p>
        {brief?.requirements?.length ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
            {brief.requirements.map((r) => (
              <li key={r.featureType}>
                {r.featureType.replaceAll("_", " ")} · {r.importance} · {String(r.value)}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <nav aria-label="Learning stages">
        <ol className="flex flex-wrap gap-2 text-xs">
          {STAGES.map((s, i) => (
            <li
              key={s}
              className={`rounded-full border px-3 py-1 ${
                i === stageIndex
                  ? "border-[#005B7F] bg-[#005B7F] font-black text-white"
                  : i < stageIndex
                    ? "border-slate-300 bg-slate-100"
                    : "border-slate-200 text-slate-500"
              }`}
              aria-current={i === stageIndex ? "step" : undefined}
            >
              {s.replaceAll("_", " ")}
            </li>
          ))}
        </ol>
      </nav>

      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p role="status" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          {hint}
        </p>
      ) : null}

      {!session ? (
        <button
          type="button"
          className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => void start()}
        >
          Start flight simulator
        </button>
      ) : null}

      {session && stage === "orientation" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-black">Orientation</h3>
          <p>
            Taylor needs a step-free route to Room 3.12 at 10:00 am. Predict after reading the
            requirements — evidence is not fully revealed yet.
          </p>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() => void run({ action: "advance", sessionId: session.id, to: "prediction" })}
          >
            Continue to prediction
          </button>
        </section>
      ) : null}

      {session && (stage === "prediction" || stage === "investigation") && !session.prediction ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-black">Prediction</h3>
          <label className="block font-semibold">
            Predicted status
            <select
              className={`mt-1 w-full max-w-md rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={predStatus}
              onChange={(e) => setPredStatus(e.target.value)}
            >
              <option value="suitable">Suitable</option>
              <option value="suitable_with_conditions">Suitable with conditions</option>
              <option value="blocked">Blocked</option>
              <option value="unknown">Information incomplete</option>
            </select>
          </label>
          <label className="block font-semibold">
            Confidence (0–100)
            <input
              type="number"
              min={0}
              max={100}
              className={`mt-1 w-32 rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={predConf}
              onChange={(e) => setPredConf(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              void run({
                action: "predict",
                sessionId: session.id,
                status: predStatus,
                confidence: predConf,
              })
            }
          >
            Submit prediction
          </button>
        </section>
      ) : null}

      {session && session.prediction && ["investigation", "decision"].includes(stage) ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-black">Investigation</h3>
          <p className="text-sm text-slate-600">
            Choose evidence to inspect. Nothing is auto-revealed.
          </p>
          <ul className="space-y-2">
            {(brief?.evidenceCatalog ?? []).map((ev) => {
              const opened = session.inspectedEvidenceIds.includes(ev.id);
              return (
                <li key={ev.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                  <span className="font-semibold">{ev.title}</span>
                  <span className="text-slate-500">
                    {ev.sourceType.replaceAll("_", " ")} · {ev.status}
                  </span>
                  {opened ? (
                    <span className="font-black text-green-800">Inspected</span>
                  ) : (
                    <button
                      type="button"
                      className={`min-h-10 rounded-lg border px-3 font-bold ${mapableCareFocusRing}`}
                      onClick={() =>
                        void run({
                          action: "reveal_evidence",
                          sessionId: session.id,
                          evidenceId: ev.id,
                        })
                      }
                    >
                      Inspect
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className={`min-h-11 rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
            onClick={() => void run({ action: "hint", sessionId: session.id })}
          >
            Request graduated hint
          </button>

          <h3 className="text-xl font-black">Decision</h3>
          <label className="block font-semibold">
            Entrance
            <select
              className={`mt-1 w-full max-w-md rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={entranceId}
              onChange={(e) => setEntranceId(e.target.value)}
            >
              <option value="n-hcc-a">Entrance A (steps)</option>
              <option value="n-hcc-b">Entrance B (level)</option>
            </select>
          </label>
          <label className="block font-semibold">
            Route
            <select
              className={`mt-1 w-full max-w-md rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
            >
              <option value="route-main-lift">Main lift</option>
              <option value="route-western-lift">Western lift</option>
            </select>
          </label>
          <label className="block font-semibold">
            Identified blockers (comma-separated)
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </label>
          <label className="block font-semibold">
            Identified unknowns (comma-separated)
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={unknowns}
              onChange={(e) => setUnknowns(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              void run({
                action: "decide",
                sessionId: session.id,
                entranceId,
                routeId,
                blockers: blockers
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                unknowns: unknowns
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                venueQuestion: "Is the accessible toilet operating today?",
                contingency: "Use western lift if main lift fails.",
              })
            }
          >
            Submit decision
          </button>
        </section>
      ) : null}

      {session && stage === "consequence" ? (
        <section className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h3 className="text-xl font-black">Consequence</h3>
          <p role="alert" className="font-semibold">
            Live event: main lift unavailable. Your first route is no longer valid.
          </p>
          <p className="text-sm">
            Engine status so far: {session.engineDecision?.status ?? "pending"}. Inspect the
            western lift path and revise.
          </p>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              void run({
                action: "revise",
                sessionId: session.id,
                routeId: "route-western-lift",
                status: "suitable_with_conditions",
                confidence: 70,
              })
            }
          >
            Revise to western lift route
          </button>
        </section>
      ) : null}

      {session && (stage === "revision" || stage === "teach_back") && session.revisedDecision ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-black">Teach-back</h3>
          <p className="text-sm text-slate-600">
            Explain the plan to Taylor in plain language. Avoid diagnosis labels.
          </p>
          <p className="text-sm">
            Revised engine status: {session.revisedDecision.status}
          </p>
          <label className="block font-semibold">
            Teach-back text
            <textarea
              className={`mt-1 min-h-28 w-full rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={teachBack}
              onChange={(e) => setTeachBack(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              void run({ action: "teach_back", sessionId: session.id, text: teachBack }).then(
                () =>
                  run({
                    action: "advance",
                    sessionId: session.id,
                    to: "reflection",
                  }),
              )
            }
          >
            Submit teach-back
          </button>
        </section>
      ) : null}

      {session && stage === "reflection" ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-black">Reflection</h3>
          <label className="block font-semibold">
            Reflections (one per line)
            <textarea
              className={`mt-1 min-h-32 w-full rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              void run({
                action: "reflect",
                sessionId: session.id,
                reflections: reflections
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }).then(() =>
                run({ action: "advance", sessionId: session.id, to: "transfer" }),
              )
            }
          >
            Continue to transfer
          </button>
        </section>
      ) : null}

      {session && (stage === "transfer" || stage === "complete") && !complete?.rubric ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-black">Transfer — 7:00 pm visit</h3>
          <p>
            Same venue at 7:00 pm. Entrance B is closed. Is another route available, blocked,
            needing special access, or still incomplete?
          </p>
          <label className="block font-semibold">
            Your answer
            <textarea
              className={`mt-1 min-h-24 w-full rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={transferAnswer}
              onChange={(e) => setTransferAnswer(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              void run({
                action: "transfer",
                sessionId: session.id,
                answer: transferAnswer,
              })
            }
          >
            Complete scenario
          </button>
        </section>
      ) : null}

      {complete?.mirror || complete?.rubric ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 p-5" aria-live="polite">
          <h3 className="text-xl font-black">Decision Mirror</h3>
          <ul className="list-disc pl-5 text-sm text-slate-700">
            {(complete.mirror?.narratableFindings ?? []).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="text-sm">
            Evidence inspected: {complete.mirror?.evidenceInspectedCount ?? 0}. Hard requirement
            overlooked: {complete.mirror?.hardRequirementOverlooked ? "yes" : "no"}. Unknown
            treated as present: {complete.mirror?.unknownTreatedAsPresent ? "yes" : "no"}.
          </p>
          {complete.eveningDecision ? (
            <p className="text-sm">
              Evening transfer engine status: {complete.eveningDecision.status}.{" "}
              {(complete.eveningDecision.conditions ?? []).join(" ")}
            </p>
          ) : null}
          {complete.rubric ? (
            <div>
              <h3 className="text-xl font-black">Rubric</h3>
              <p className="font-semibold">Overall: {complete.rubric.overallLevel}</p>
              <ul className="mt-2 space-y-2 text-sm">
                {complete.rubric.criteria.map((c) => (
                  <li key={c.criterionId} className="rounded-lg border p-3">
                    <span className="font-black">{c.criterionId.replaceAll("_", " ")}</span> —{" "}
                    {c.status.replaceAll("_", " ")}
                    <p className="text-slate-700">{c.explanation}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm">Strengths: {complete.rubric.strengths.join("; ")}</p>
              <p className="text-sm">Next focus: {complete.rubric.nextFocus.join("; ")}</p>
            </div>
          ) : null}
          <Link
            href="/access-intelligence/buildings/place-harbour-civic#visit"
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          >
            Return to Visit mode
          </Link>
        </section>
      ) : null}
    </div>
  );
}
