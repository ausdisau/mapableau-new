"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

import type {
  LearningScenario,
  PracticeSession,
  RubricEvaluation,
} from "@/lib/access-intelligence/learning/schemas";
import { LEARNING_STAGE_ORDER, progressPercent } from "@/lib/access-intelligence/learning/state-machine";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type EvidenceItem = {
  id: string;
  label: string;
  status: string;
  summary: string;
};

async function postSession(body: Record<string, unknown>) {
  const res = await fetch("/api/access-intelligence/learn/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Session request failed");
  return data;
}

export function ScenarioPracticeWorkspace({
  scenario,
  initialMode = "practice",
}: {
  scenario: LearningScenario;
  initialMode?: "practice" | "guide_me";
}) {
  const liveId = useId();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<RubricEvaluation | null>(null);
  const [eventNote, setEventNote] = useState<string | null>(null);
  const [teachBack, setTeachBack] = useState("");
  const [teachFeedback, setTeachFeedback] = useState<string | null>(null);
  const [reflections, setReflections] = useState<string[]>([]);
  const [transferText, setTransferText] = useState("");
  const [confidence, setConfidence] = useState(60);
  const [announce, setAnnounce] = useState("");
  const [error, setError] = useState<string | null>(null);
  const decisionRef = useRef<HTMLFieldSetElement>(null);

  const decisionPoint = scenario.decisionPoints[0];
  const stageMeta = useMemo(
    () => scenario.stages.find((s) => s.stage === session?.stage),
    [scenario.stages, session?.stage],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await postSession({
          scenarioId: scenario.id,
          mode: initialMode,
        });
        if (!cancelled) {
          setSession(data.session);
          setAnnounce(`Started scenario. Stage: orientation.`);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to start");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scenario.id, initialMode]);

  useEffect(() => {
    if (session?.stage) {
      setAnnounce(`Stage changed to ${session.stage.replaceAll("_", " ")}.`);
    }
  }, [session?.stage]);

  async function run(body: Record<string, unknown>) {
    setError(null);
    try {
      const data = await postSession(body);
      if (data.session) setSession(data.session);
      if (data.evidence) setEvidence(data.evidence);
      if (data.text) setHint(data.text);
      if (data.evaluation) setEvaluation(data.evaluation);
      if (data.event) {
        setEventNote(`${data.event.title}: ${data.event.description}`);
      }
      if (data.feedback) {
        setTeachFeedback(Array.isArray(data.feedback) ? data.feedback.join(" ") : String(data.feedback));
      }
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      return null;
    }
  }

  if (!session) {
    return (
      <p role="status" className="text-slate-600">
        {error ?? "Starting scenario…"}
      </p>
    );
  }

  const progress = progressPercent(session.stage);

  return (
    <div className="space-y-8">
      <div
        id={liveId}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announce}
      </div>

      <section aria-labelledby="scenario-goal-heading" className="space-y-3">
        <h2 id="scenario-goal-heading" className="text-2xl font-black tracking-[-0.03em]">
          {scenario.title}
        </h2>
        <p className="text-lg text-slate-700">
          <span className="font-bold">Scenario goal:</span> {scenario.humanGoal}
        </p>
        <p className="text-sm text-slate-600">
          Selected Access Passport: <span className="font-semibold">{scenario.passportId}</span>{" "}
          · Destination: {scenario.destination}
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Scenario progress ${progress} percent, stage ${session.stage}`}
          className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-full bg-[#005B7F] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {LEARNING_STAGE_ORDER.map((s) => (
            <li
              key={s}
              className={s === session.stage ? "text-[#005B7F]" : undefined}
              aria-current={s === session.stage ? "step" : undefined}
            >
              {s.replaceAll("_", " ")}
            </li>
          ))}
        </ol>
      </section>

      {stageMeta ? (
        <section
          aria-labelledby="stage-prompt-heading"
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F6FBFC] to-white p-5"
        >
          <h3 id="stage-prompt-heading" className="text-lg font-black">
            {stageMeta.title}
          </h3>
          <p className="mt-2 text-slate-700">{stageMeta.prompt}</p>
        </section>
      ) : null}

      <section aria-labelledby="text-map-heading">
        <h3 id="text-map-heading" className="text-lg font-black">
          Accessible text map
        </h3>
        <p className="mt-2 text-slate-700">
          {scenario.stages.find((s) => s.stage === "orientation")?.prompt ??
            "Text alternative describes entrance, vertical circulation, and destination."}
        </p>
      </section>

      {(session.stage === "investigation" ||
        session.evidenceRevealed ||
        session.stage === "decision" ||
        session.stage === "consequence" ||
        session.stage === "revision") && (
        <section aria-labelledby="evidence-heading">
          <h3 id="evidence-heading" className="text-lg font-black">
            Evidence workspace
          </h3>
          {evidence.length === 0 ? (
            <button
              type="button"
              className={`mt-3 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
              onClick={() =>
                run({ action: "reveal_evidence", sessionId: session.id })
              }
            >
              Reveal evidence
            </button>
          ) : (
            <ul className="mt-3 space-y-3">
              {evidence.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-bold">{item.label}</p>
                  <p className="text-sm uppercase tracking-wide text-slate-500">
                    Status: {item.status}
                  </p>
                  <p className="mt-1 text-slate-700">{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
          {scenario.unknownHighlights.length > 0 ? (
            <aside
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
              aria-label="Meaningful unknowns"
            >
              <p className="font-bold text-amber-900">Meaningful unknowns</p>
              <ul className="mt-2 list-disc pl-5 text-amber-950">
                {scenario.unknownHighlights.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </aside>
          ) : null}
        </section>
      )}

      <section aria-labelledby="route-heading">
        <h3 id="route-heading" className="text-lg font-black">
          Route workspace
        </h3>
        <p className="mt-2 text-slate-700">
          Plan toward <strong>{scenario.destination}</strong> at{" "}
          <strong>{scenario.placeId}</strong>. Prefer verified step-free vertical
          circulation when required. Contingencies activate when live events fire.
        </p>
        {eventNote ? (
          <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-950" role="status">
            Dynamic event: {eventNote}
          </p>
        ) : null}
      </section>

      {session.stage === "prediction" || session.stage === "decision" || session.stage === "revision" ? (
        <fieldset
          ref={decisionRef}
          className="space-y-3 rounded-2xl border border-slate-300 p-5"
          aria-labelledby="decision-controls-heading"
        >
          <legend id="decision-controls-heading" className="px-1 text-lg font-black">
            {session.stage === "prediction"
              ? "Confidence prediction & predicted decision"
              : "Decision controls"}
          </legend>
          <p className="text-slate-700">{decisionPoint?.prompt}</p>
          {session.stage === "prediction" ? (
            <label className="block text-sm font-semibold text-slate-700">
              Confidence prediction ({confidence}%)
              <input
                type="range"
                min={0}
                max={100}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className={`mt-2 block w-full ${mapableCareFocusRing}`}
              />
            </label>
          ) : null}
          <div className="flex flex-col gap-2" role="group" aria-label="Options">
            {decisionPoint?.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`min-h-11 rounded-xl border border-slate-300 px-4 text-left font-semibold hover:border-[#005B7F] ${mapableCareFocusRing}`}
                onClick={() => {
                  if (session.stage === "prediction") {
                    void run({
                      action: "predict",
                      sessionId: session.id,
                      optionId: opt.id,
                      confidencePrediction: confidence,
                    }).then(() =>
                      run({ action: "advance", sessionId: session.id }),
                    );
                  } else {
                    void run({
                      action: "decide",
                      sessionId: session.id,
                      optionId: opt.id,
                    }).then((data) => {
                      if (data) {
                        void run({
                          action: "dynamic_event",
                          sessionId: session.id,
                        });
                      }
                    });
                  }
                }}
              >
                {opt.label}
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Predicted status: {opt.predictedStatus.replaceAll("_", " ")}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <section aria-labelledby="hint-heading" className="flex flex-wrap items-center gap-3">
        <h3 id="hint-heading" className="sr-only">
          Hint controls
        </h3>
        <button
          type="button"
          className={`min-h-11 rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
          onClick={() => run({ action: "hint", sessionId: session.id })}
        >
          Reveal hint (level {Math.min(3, session.hintLevel + 1)})
        </button>
        {hint ? (
          <p className="text-slate-700" role="status">
            Hint: {hint}
          </p>
        ) : null}
      </section>

      {session.stage === "orientation" ? (
        <button
          type="button"
          className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => run({ action: "advance", sessionId: session.id })}
        >
          Continue to prediction
        </button>
      ) : null}

      {session.stage === "investigation" && !session.evidenceRevealed ? (
        <button
          type="button"
          className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => run({ action: "reveal_evidence", sessionId: session.id })}
        >
          Open evidence workspace
        </button>
      ) : null}

      {session.stage === "investigation" && session.evidenceRevealed ? (
        <button
          type="button"
          className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => run({ action: "advance", sessionId: session.id })}
        >
          Continue to decision
        </button>
      ) : null}

      {(session.stage === "consequence" || evaluation) && (
        <section aria-labelledby="consequence-heading" className="rounded-2xl border border-slate-200 p-5">
          <h3 id="consequence-heading" className="text-lg font-black">
            Consequence panel
          </h3>
          <p className="mt-2 text-slate-700">
            {(evaluation?.passed ?? session.rubricEvaluation?.passed)
              ? scenario.formativeFeedback.good
              : scenario.formativeFeedback.needs_work}
          </p>
          <ul className="mt-3 list-disc pl-5 text-slate-700">
            {(evaluation ?? session.rubricEvaluation)?.feedback.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {session.stage === "consequence" ? (
            <button
              type="button"
              className={`mt-4 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
              onClick={() => run({ action: "advance", sessionId: session.id })}
            >
              Continue to revision
            </button>
          ) : null}
        </section>
      )}

      {session.stage === "revision" ? (
        <button
          type="button"
          className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => run({ action: "request_teach_back", sessionId: session.id })}
        >
          Continue to teach-back
        </button>
      ) : null}

      {session.stage === "teach_back" ? (
        <section aria-labelledby="teach-heading">
          <h3 id="teach-heading" className="text-lg font-black">
            Teach-back input
          </h3>
          <p className="mt-2 text-slate-700">{scenario.teachBackPrompt}</p>
          <label className="mt-3 block">
            <span className="sr-only">Teach-back response</span>
            <textarea
              className={`min-h-28 w-full rounded-xl border border-slate-300 p-3 ${mapableCareFocusRing}`}
              value={teachBack}
              onChange={(e) => setTeachBack(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`mt-3 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              run({
                action: "teach_back",
                sessionId: session.id,
                text: teachBack,
              }).then(() => run({ action: "advance", sessionId: session.id }))
            }
          >
            Submit teach-back
          </button>
          {teachFeedback ? (
            <p className="mt-2 text-slate-700" role="status">
              {teachFeedback}
            </p>
          ) : null}
        </section>
      ) : null}

      {session.stage === "reflection" ? (
        <section aria-labelledby="reflect-heading">
          <h3 id="reflect-heading" className="text-lg font-black">
            Reflection prompts
          </h3>
          <ul className="mt-3 space-y-4">
            {scenario.reflectionPrompts.map((prompt, idx) => (
              <li key={prompt}>
                <label className="block font-semibold text-slate-800">
                  {prompt}
                  <textarea
                    className={`mt-2 min-h-20 w-full rounded-xl border border-slate-300 p-3 font-normal ${mapableCareFocusRing}`}
                    value={reflections[idx] ?? ""}
                    onChange={(e) => {
                      const next = [...reflections];
                      next[idx] = e.target.value;
                      setReflections(next);
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`mt-4 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              run({
                action: "reflect",
                sessionId: session.id,
                reflections,
              }).then(() => run({ action: "advance", sessionId: session.id }))
            }
          >
            Save reflections
          </button>
        </section>
      ) : null}

      {session.stage === "transfer" ? (
        <section aria-labelledby="transfer-heading">
          <h3 id="transfer-heading" className="text-lg font-black">
            Transfer activity: {scenario.transferTask.title}
          </h3>
          <p className="mt-2 text-slate-700">{scenario.transferTask.instructions}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            {scenario.transferTask.successCriteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <label className="mt-3 block">
            <span className="sr-only">Transfer response</span>
            <textarea
              className={`min-h-28 w-full rounded-xl border border-slate-300 p-3 ${mapableCareFocusRing}`}
              value={transferText}
              onChange={(e) => setTransferText(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`mt-3 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() =>
              run({
                action: "transfer",
                sessionId: session.id,
                response: transferText,
              })
            }
          >
            Complete transfer
          </button>
        </section>
      ) : null}

      {session.stage === "complete" ? (
        <section aria-labelledby="complete-heading" className="rounded-2xl bg-[#E8F4F8] p-5">
          <h3 id="complete-heading" className="text-lg font-black">
            Scenario complete
          </h3>
          <p className="mt-2 text-slate-700">
            Mastery updates by concept only — no public leaderboards.{" "}
            <a
              href="/access-intelligence"
              className={`font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
            >
              Return to Plan mode
            </a>{" "}
            anytime without finishing lessons.
          </p>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}

      {initialMode === "guide_me" ? (
        <aside className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          Guide Me mode explains each step. You can inspect evidence and hints.
          Deterministic production access decisions are unchanged by narration.
        </aside>
      ) : null}
    </div>
  );
}
