"use client";

import { useEffect, useMemo, useReducer, useState } from "react";

import { AgencyTimeline } from "@/components/labs/AgencyTimeline";
import { ChoicePanel } from "@/components/labs/ChoicePanel";
import { ExperimentShell } from "@/components/labs/ExperimentShell";
import { FeedbackPrompt } from "@/components/labs/FeedbackPrompt";
import { ReplayControls } from "@/components/labs/ReplayControls";
import { ScenarioPlayer } from "@/components/labs/ScenarioPlayer";
import type {
  AutonomyMode,
  ExperimentResult,
  ScenarioState,
} from "@/lib/labs/contracts";
import {
  AUTONOMY_MODE_DESCRIPTIONS,
  AUTONOMY_MODE_LABELS,
  AUTONOMY_MODES,
} from "@/lib/labs/contracts";
import {
  mobilityFuturesExperiment,
  mobilityFuturesScenario,
} from "@/lib/labs/experiments/mobility-futures";
import {
  createInitialScenarioState,
  reduceScenario,
  type ScenarioCommand,
} from "@/lib/labs/runtime";

type PresentationMode = ScenarioState["presentationMode"];

function nowIso() {
  return new Date().toISOString();
}

function newRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function MobilityFuturesExperiment() {
  const scenario = mobilityFuturesScenario;
  const [selectedMode, setSelectedMode] = useState<AutonomyMode>("INFORM");
  const [completedRuns, setCompletedRuns] = useState<ExperimentResult[]>([]);
  const [lastDecisionId, setLastDecisionId] = useState<string | null>(null);
  const [preferReducedMotion, setPreferReducedMotion] = useState(false);

  const [state, dispatch] = useReducer(
    (current: ScenarioState, command: ScenarioCommand) =>
      reduceScenario(current, command, scenario),
    undefined,
    () => createInitialScenarioState(scenario, "INFORM"),
  );

  const comparison = useMemo(() => {
    if (completedRuns.length < 2) return null;
    const a = completedRuns[completedRuns.length - 2]!;
    const b = completedRuns[completedRuns.length - 1]!;
    return { a, b };
  }, [completedRuns]);

  function startOrReplay(mode: AutonomyMode, replay: boolean) {
    dispatch({
      type: replay ? "REPLAY" : "START",
      autonomyMode: mode,
      runId: newRunId(),
      at: nowIso(),
    });
    setLastDecisionId(null);
  }

  function choose(optionId: string) {
    const decisionId = state.pendingDecision?.id ?? null;
    dispatch({ type: "PARTICIPANT_CHOICE", optionId, at: nowIso() });
    setLastDecisionId(decisionId);
  }

  function continueJourney() {
    dispatch({ type: "CONTINUE", at: nowIso() });
  }

  useEffect(() => {
    if (state.phase !== "COMPLETED" || !state.completedAt) return;
    setCompletedRuns((prev) => {
      if (prev.some((r) => r.runId === state.runId)) return prev;
      return [
        ...prev,
        {
          runId: state.runId,
          experimentId: mobilityFuturesExperiment.id,
          autonomyMode: state.autonomyMode,
          choices: state.choices,
          agencyTimeline: state.agencyTimeline,
          feedback: state.feedback,
          completedAt: state.completedAt!,
          labsSimulationData: true,
        },
      ];
    });
  }, [state]);

  return (
    <ExperimentShell
      title={mobilityFuturesExperiment.title}
      summary={mobilityFuturesExperiment.summary}
      status={mobilityFuturesExperiment.status}
    >
      <div
        className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] ${preferReducedMotion ? "" : ""}`}
        data-reduced-motion={preferReducedMotion ? "true" : "false"}
      >
        <div className="space-y-6 min-w-0">
          <section
            className="rounded-3xl border border-white/10 p-5"
            aria-labelledby="mode-heading"
          >
            <h2 id="mode-heading" className="text-xl font-black">
              Autonomy mode
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Choose how the simulated system should behave before you start.
              {state.phase !== "IDLE" ? (
                <>
                  {" "}
                  Active run:{" "}
                  <span className="font-bold text-[#F8C51C]">
                    {AUTONOMY_MODE_LABELS[state.autonomyMode]}
                  </span>
                  .
                </>
              ) : null}
            </p>
            <div
              className="mt-4 grid gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Autonomy mode"
            >
              {AUTONOMY_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={selectedMode === mode}
                  className={`min-h-20 rounded-2xl border px-4 py-3 text-left focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 ${
                    selectedMode === mode
                      ? "border-[#F8C51C] bg-[#F8C51C]/15"
                      : "border-white/15"
                  }`}
                  onClick={() => setSelectedMode(mode)}
                >
                  <span className="font-black">{AUTONOMY_MODE_LABELS[mode]}</span>
                  <span className="mt-1 block text-sm text-white/65">
                    {AUTONOMY_MODE_DESCRIPTIONS[mode]}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="min-h-12 rounded-xl bg-[#F8C51C] px-5 font-black text-[#071727] focus:outline-none focus:ring-4 focus:ring-white/40"
                onClick={() => startOrReplay(selectedMode, false)}
              >
                Start simulated journey
              </button>
              <button
                type="button"
                className="min-h-12 rounded-xl border border-white/20 px-5 font-black focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                onClick={() => dispatch({ type: "PAUSE", at: nowIso() })}
                disabled={
                  state.phase !== "RUNNING" && state.phase !== "DECISION_REQUIRED"
                }
              >
                Pause
              </button>
              <button
                type="button"
                className="min-h-12 rounded-xl border border-white/20 px-5 font-black focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                onClick={continueJourney}
                disabled={
                  state.phase === "IDLE" ||
                  state.phase === "DECISION_REQUIRED" ||
                  state.phase === "COMPLETED"
                }
              >
                {state.phase === "PAUSED" ? "Resume" : "Continue"}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-xl border border-white/20 px-5 font-black focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                onClick={() => dispatch({ type: "RESET" })}
              >
                Reset
              </button>
            </div>
          </section>

          <section
            className="rounded-3xl border border-white/10 p-5"
            aria-labelledby="presentation-heading"
          >
            <h2 id="presentation-heading" className="text-lg font-black">
              Presentation
            </h2>
            <div
              className="mt-3 flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Presentation mode"
            >
              {(
                [
                  ["STANDARD_VISUAL", "Standard visual"],
                  ["SIMPLIFIED_2D", "Simplified 2D"],
                  ["TEXT", "Text"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={state.presentationMode === mode}
                  data-presentation-mode={mode}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 ${
                    state.presentationMode === mode
                      ? "border-[#F8C51C] bg-[#F8C51C]/15"
                      : "border-white/15"
                  }`}
                  onClick={() =>
                    dispatch({
                      type: "SET_PRESENTATION",
                      mode: mode as PresentationMode,
                    })
                  }
                >
                  {label}
                </button>
              ))}            </div>
            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={preferReducedMotion}
                onChange={(e) => setPreferReducedMotion(e.target.checked)}
              />
              Prefer reduced motion
            </label>
          </section>

          <ScenarioPlayer scenario={scenario} state={state} />

          {state.pendingDecision ? (
            <ChoicePanel
              decision={state.pendingDecision}
              onChoose={choose}
              disabled={state.phase === "PAUSED"}
            />
          ) : null}

          {lastDecisionId && state.phase !== "IDLE" ? (
            <FeedbackPrompt
              decisionPointId={lastDecisionId}
              onSubmit={(question, response) =>
                dispatch({
                  type: "SUBMIT_FEEDBACK",
                  decisionPointId: lastDecisionId,
                  question,
                  response,
                  at: nowIso(),
                })
              }
            />
          ) : null}

          {comparison ? (
            <section
              className="rounded-3xl border border-white/10 p-5"
              aria-labelledby="compare-heading"
            >
              <h2 id="compare-heading" className="text-xl font-black">
                Compare runs
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[comparison.a, comparison.b].map((run, index) => (
                  <article
                    key={run.runId}
                    className="rounded-2xl border border-white/10 p-4"
                  >
                    <h3 className="font-black">
                      Run {index + 1}: {AUTONOMY_MODE_LABELS[run.autonomyMode]}
                    </h3>
                    <p className="mt-2 text-sm text-white/65">
                      Decisions: {run.choices.length}. Timeline events:{" "}
                      {run.agencyTimeline.length}.
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/80">
                      {run.choices.map((c) => (
                        <li key={c.id}>{c.label}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <AgencyTimeline events={state.agencyTimeline} />
          <ReplayControls
            canReplay={state.phase === "COMPLETED" || completedRuns.length > 0}
            completedRuns={completedRuns.length}
            onReplay={() => {
              const nextMode =
                selectedMode === "COMPARE"
                  ? selectedMode === state.autonomyMode
                    ? "INFORM"
                    : selectedMode
                  : selectedMode === state.autonomyMode
                    ? "SUGGEST"
                    : selectedMode;
              startOrReplay(nextMode, true);
            }}
          />
        </div>
      </div>
    </ExperimentShell>
  );
}
