"use client";

import { useMemo, useState } from "react";

import { ExperimentShell } from "@/components/labs/ExperimentShell";
import {
  HOME_LAB_CLAIM_LABELS,
  HOME_LAB_FEEDBACK_PROMPTS,
  HOME_RESPONSE_MODE_DESCRIPTIONS,
  HOME_RESPONSE_MODE_LABELS,
  HOME_RESPONSE_MODES,
  homeLabExperiment,
  type HomeResponseMode,
} from "@/lib/labs/experiments/home";

type Observation = {
  id: string;
  label: string;
  value: string;
  confidence: "KNOWN" | "UNKNOWN" | "UNAVAILABLE";
};

type ProposedAction = {
  id: string;
  label: string;
  risk: "LOW" | "HIGH";
  preAuthorised: boolean;
};

const OBSERVATIONS: Observation[] = [
  { id: "hall-light", label: "Hallway light", value: "Off", confidence: "KNOWN" },
  { id: "front-door", label: "Front door", value: "Closed", confidence: "KNOWN" },
  { id: "front-lock", label: "Front lock", value: "Locked", confidence: "KNOWN" },
  {
    id: "charger",
    label: "Wheelchair charger",
    value: "Unknown",
    confidence: "UNKNOWN",
  },
  {
    id: "lift",
    label: "Building lift",
    value: "Unknown",
    confidence: "UNKNOWN",
  },
];

const PROPOSALS: ProposedAction[] = [
  {
    id: "turn-on-hall",
    label: "Turn on hallway light",
    risk: "LOW",
    preAuthorised: true,
  },
  {
    id: "check-door",
    label: "Confirm front door is closed",
    risk: "LOW",
    preAuthorised: true,
  },
  {
    id: "lock-front",
    label: "Lock front door",
    risk: "HIGH",
    preAuthorised: false,
  },
];

type Phase = "setup" | "run" | "feedback" | "done";

export function HomeExperiment() {
  const [mode, setMode] = useState<HomeResponseMode>("REPORT_ONLY");
  const [simplified, setSimplified] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [executedIds, setExecutedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const recommendations = useMemo(() => {
    if (mode === "REPORT_ONLY") return [] as ProposedAction[];
    return PROPOSALS;
  }, [mode]);

  function startRun() {
    setApprovedIds([]);
    setExecutedIds([]);
    setPhase("run");
    if (mode === "BOUNDED_AUTO") {
      setExecutedIds(
        PROPOSALS.filter((p) => p.preAuthorised && p.risk === "LOW").map(
          (p) => p.id,
        ),
      );
    }
  }

  function approve(id: string) {
    setApprovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function refuse(id: string) {
    setApprovedIds((prev) => prev.filter((x) => x !== id));
  }

  function continueWithApproved() {
    setExecutedIds(approvedIds);
    setPhase("feedback");
  }

  function finishFeedback() {
    setPhase("done");
  }

  return (
    <ExperimentShell
      title={homeLabExperiment.title}
      summary={homeLabExperiment.summary}
      status={homeLabExperiment.status}
    >
      <div data-reduced-motion={reducedMotion ? "true" : "false"}>
        <div className="mb-6 flex flex-wrap gap-2" aria-label="Claim labels">
          {HOME_LAB_CLAIM_LABELS.map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/70"
            >
              {label}
            </span>
          ))}
        </div>

        <section
          className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5"
          aria-labelledby="home-lab-preferences"
        >
          <h2 id="home-lab-preferences" className="text-xl font-black">
            Access preferences
          </h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={simplified}
                onChange={(e) => setSimplified(e.target.checked)}
                className="size-4"
              />
              Simplified mode
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="size-4"
              />
              Prefer reduced motion
            </label>
          </div>
        </section>

        {phase === "setup" ? (
          <section aria-labelledby="home-lab-modes">
            <h2 id="home-lab-modes" className="text-2xl font-black">
              How should your home respond?
            </h2>
            <p className="mt-2 max-w-3xl text-white/70">
              Scenario: you are preparing to leave home. Compare four response
              styles using synthetic data only.
            </p>
            <div
              role="radiogroup"
              aria-label="Home response mode"
              className="mt-6 grid gap-3"
            >
              {HOME_RESPONSE_MODES.map((option) => {
                const selected = mode === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMode(option)}
                    className={`min-h-14 rounded-2xl border px-4 py-3 text-left focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 ${
                      selected
                        ? "border-[#F8C51C] bg-[#F8C51C]/15"
                        : "border-white/15 bg-white/[0.03]"
                    }`}
                  >
                    <span className="block font-black">
                      {HOME_RESPONSE_MODE_LABELS[option]}
                    </span>
                    {!simplified ? (
                      <span className="mt-1 block text-sm text-white/65">
                        {HOME_RESPONSE_MODE_DESCRIPTIONS[option]}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={startRun}
              className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#F8C51C] px-5 py-3 font-black text-[#071727] focus:outline-none focus:ring-4 focus:ring-white/40"
            >
              Start simulated leave-home check
            </button>
          </section>
        ) : null}

        {phase !== "setup" ? (
          <section className="mt-8" aria-labelledby="home-lab-observations">
            <h2 id="home-lab-observations" className="text-2xl font-black">
              Synthetic home state
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {OBSERVATIONS.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="font-black">{item.label}</p>
                  <p className="mt-1 text-white/75">
                    {item.value}{" "}
                    <span className="text-xs uppercase tracking-wide text-white/50">
                      ({item.confidence})
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-white/60" role="status">
              Unknown lift and charger state are shown as UNKNOWN — not treated
              as available.
            </p>
          </section>
        ) : null}

        {phase === "run" ? (
          <section className="mt-8" aria-labelledby="home-lab-actions">
            <h2 id="home-lab-actions" className="text-2xl font-black">
              {HOME_RESPONSE_MODE_LABELS[mode]}
            </h2>
            <p className="mt-2 text-white/70">
              {HOME_RESPONSE_MODE_DESCRIPTIONS[mode]}
            </p>

            {mode === "REPORT_ONLY" ? (
              <p className="mt-4 rounded-2xl border border-white/10 p-4 text-white/80">
                No actions are suggested or taken. You remain fully in control.
              </p>
            ) : null}

            {mode === "BOUNDED_AUTO" ? (
              <div className="mt-4 rounded-2xl border border-[#F8C51C]/30 bg-[#F8C51C]/10 p-4">
                <p className="font-black text-[#F8C51C]">
                  Simulated automatic steps
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
                  {executedIds.map((id) => {
                    const item = PROPOSALS.find((p) => p.id === id);
                    return <li key={id}>{item?.label}</li>;
                  })}
                </ul>
                <p className="mt-2 text-sm text-white/65">
                  High-risk lock actions were not auto-run.
                </p>
              </div>
            ) : null}

            {recommendations.length > 0 && mode !== "BOUNDED_AUTO" ? (
              <ul className="mt-4 space-y-3">
                {recommendations.map((item) => {
                  const approved = approvedIds.includes(item.id);
                  return (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="font-black">{item.label}</p>
                      <p className="mt-1 text-sm text-white/60">
                        Risk: {item.risk}
                        {item.preAuthorised
                          ? " · Pre-authorisable"
                          : " · Needs confirmation"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => approve(item.id)}
                          aria-pressed={approved}
                          className="min-h-11 rounded-xl border border-[#F8C51C]/40 px-4 py-2 font-bold text-[#F8C51C] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                        >
                          {approved ? "Approved" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => refuse(item.id)}
                          className="min-h-11 rounded-xl border border-white/20 px-4 py-2 font-bold text-white/80 focus:outline-none focus:ring-4 focus:ring-white/30"
                        >
                          Refuse
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {mode === "PREPARE_AND_ASK" || mode === "RECOMMEND" ? (
                <button
                  type="button"
                  onClick={continueWithApproved}
                  className="min-h-12 rounded-xl bg-[#F8C51C] px-5 py-3 font-black text-[#071727] focus:outline-none focus:ring-4 focus:ring-white/40"
                >
                  Continue with approved actions
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhase("feedback")}
                  className="min-h-12 rounded-xl bg-[#F8C51C] px-5 py-3 font-black text-[#071727] focus:outline-none focus:ring-4 focus:ring-white/40"
                >
                  Continue to feedback
                </button>
              )}
            </div>
          </section>
        ) : null}

        {phase === "feedback" ? (
          <section className="mt-8" aria-labelledby="home-lab-feedback">
            <h2 id="home-lab-feedback" className="text-2xl font-black">
              Your feedback
            </h2>
            <div className="mt-4 space-y-6">
              {HOME_LAB_FEEDBACK_PROMPTS.map((prompt) => (
                <fieldset
                  key={prompt.question}
                  className="rounded-2xl border border-white/10 p-4"
                >
                  <legend className="px-1 font-black">{prompt.question}</legend>
                  <div
                    role="radiogroup"
                    aria-label={prompt.question}
                    className="mt-3 flex flex-wrap gap-2"
                  >
                    {prompt.answers.map((answer) => {
                      const selected = feedback[prompt.question] === answer;
                      return (
                        <button
                          key={answer}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() =>
                            setFeedback((prev) => ({
                              ...prev,
                              [prompt.question]: answer,
                            }))
                          }
                          className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 ${
                            selected
                              ? "border-[#F8C51C] bg-[#F8C51C]/15 text-[#F8C51C]"
                              : "border-white/20 text-white/80"
                          }`}
                        >
                          {answer}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <button
              type="button"
              onClick={finishFeedback}
              className="mt-6 min-h-12 rounded-xl bg-[#F8C51C] px-5 py-3 font-black text-[#071727] focus:outline-none focus:ring-4 focus:ring-white/40"
            >
              Finish experiment
            </button>
          </section>
        ) : null}

        {phase === "done" ? (
          <section
            className="mt-8 rounded-3xl border border-white/10 p-5"
            aria-live="polite"
          >
            <h2 className="text-2xl font-black">Thank you</h2>
            <p className="mt-2 text-white/75">
              Your responses stay in this browser session for the experiment
              only. No physical devices were controlled.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase("setup");
                setFeedback({});
                setApprovedIds([]);
                setExecutedIds([]);
              }}
              className="mt-4 min-h-11 rounded-xl border border-white/20 px-4 py-2 font-bold focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              Run again
            </button>
          </section>
        ) : null}
      </div>
    </ExperimentShell>
  );
}
