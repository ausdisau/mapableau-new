"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CHALLENGE_MODE_LABELS,
  CHALLENGE_SAFETY_RULES,
  COMMUNITY_CHALLENGES,
  challengeFieldNotesHref,
  filterCommunityChallenges,
  type ChallengeFocus,
} from "@/lib/access-signals/community-challenges";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

const CHECKLIST_KEY = "mapable-access-signals-challenge-checklist-v1";
const FOCUS_OPTIONS: { value: ChallengeFocus; label: string }[] = [
  { value: "all", label: "All challenge themes" },
  { value: "physical", label: "Physical access" },
  { value: "sensory", label: "Sensory access" },
  { value: "cognitive", label: "Information and wayfinding" },
];

function taskKey(challengeId: string, stepId: string) {
  return challengeId + ":" + stepId;
}

const ALLOWED_TASK_KEYS = new Set(
  COMMUNITY_CHALLENGES.flatMap((challenge) =>
    challenge.steps.map((step) => taskKey(challenge.id, step.id)),
  ),
);

export function CommunityChallengesView() {
  const [focus, setFocus] = useState<ChallengeFocus>("all");
  const [selectedId, setSelectedId] = useState(COMMUNITY_CHALLENGES[0].id);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKLIST_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const safe = Object.fromEntries(
            Object.entries(parsed).filter(
              ([key, value]) => ALLOWED_TASK_KEYS.has(key) && value === true,
            ),
          );
          setCompleted(safe);
        }
      }
    } catch {
      // Storage may be disabled. The demo remains usable in memory.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(CHECKLIST_KEY, JSON.stringify(completed));
    } catch {
      // No personal data is sent; session storage is optional.
    }
  }, [completed, hydrated]);

  const filtered = filterCommunityChallenges(focus);
  const selected =
    filtered.find((challenge) => challenge.id === selectedId) ?? filtered[0];
  const completedCount = selected.steps.filter(
    (step) => completed[taskKey(selected.id, step.id)],
  ).length;

  function toggleStep(stepId: string, checked: boolean) {
    const key = taskKey(selected.id, stepId);
    setCompleted((previous) => {
      const next = { ...previous };
      if (checked) next[key] = true;
      else delete next[key];
      return next;
    });
    setStatusMessage(
      "Preview checklist updated in this browser. No evidence submitted.",
    );
  }

  function clearSelection() {
    setCompleted((previous) => {
      const next = { ...previous };
      for (const step of selected.steps) delete next[taskKey(selected.id, step.id)];
      return next;
    });
    setStatusMessage("Preview checklist cleared for this challenge.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-[#005B7F]">
          MapAble Signal · Community participation
        </p>
        <h1 className="font-heading text-3xl font-bold text-[#0C1833] sm:text-4xl">
          Community Mapping Challenges
        </h1>
        <p className="max-w-3xl text-lg text-slate-700">
          Pick an accessibility question worth answering. Explore the fictional
          scenario, choose how you would contribute, and practise a useful,
          carefully scoped observation.
        </p>
        <p
          role="note"
          className="rounded-xl border-l-4 border-[#F97316] bg-orange-50 px-4 py-3 text-sm text-[#0C1833]"
        >
          <strong>Demonstration only.</strong> These are fictional challenges, not
          live campaigns. The checklist stays in this browser session. There is
          no registration, leaderboard, evidence upload or public publication.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="challenge-list-heading" className="space-y-4">
          <div className="space-y-3">
            <h2
              id="challenge-list-heading"
              className="font-heading text-2xl font-bold"
            >
              Choose a challenge
            </h2>
            <label htmlFor="challenge-focus" className="block text-sm font-bold">
              Filter by access focus
            </label>
            <select
              id="challenge-focus"
              value={focus}
              onChange={(event) =>
                setFocus(event.target.value as ChallengeFocus)
              }
              className={"min-h-12 w-full rounded-xl border border-slate-400 bg-white px-3 text-base " + mapableInteractiveFocusRing}
            >
              {FOCUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {filtered.map((challenge) => {
              const isSelected = selected.id === challenge.id;
              const stepsMarked = challenge.steps.filter(
                (step) => completed[taskKey(challenge.id, step.id)],
              ).length;
              return (
                <button
                  type="button"
                  key={challenge.id}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedId(challenge.id);
                    setStatusMessage("");
                  }}
                  className={
                    "block min-h-11 w-full rounded-2xl border-2 p-4 text-left " +
                    mapableInteractiveFocusRing +
                    (isSelected
                      ? " border-[#005B7F] bg-[#F0FAFC]"
                      : " border-slate-200 bg-white hover:border-[#005B7F]")
                  }
                >
                  <span className="block text-lg font-bold text-[#0C1833]">
                    {challenge.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-700">
                    {challenge.summary}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-[#005B7F]">
                    {stepsMarked} of {challenge.steps.length} demo steps marked
                    {isSelected ? " · Selected" : " · View details"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="challenge-detail-heading"
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#005B7F]">
              Fictional test precinct · {selected.focus} focus
            </p>
            <h2
              id="challenge-detail-heading"
              className="font-heading text-2xl font-bold text-[#0C1833]"
            >
              {selected.title}
            </h2>
            <p className="text-slate-700">{selected.publicQuestion}</p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4">
            <h3 className="font-bold">Choose your way to contribute</h3>
            <ul className="flex flex-wrap gap-2">
              {selected.contributionModes.map((mode) => (
                <li
                  key={mode}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {CHALLENGE_MODE_LABELS[mode]}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-700">
              You may work at your own pace or skip any step. No travel,
              disability disclosure or comparison with other contributors is required.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">Evidence to look for</h3>
            <p className="text-slate-700">{selected.evidencePrompt}</p>
            <p className="text-sm text-slate-600">
              A challenge question does not establish a red, amber or green
              access rating. Unknown remains an acceptable result.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-lg font-bold">
              Optional practice checklist
            </legend>
            {selected.steps.map((step) => (
              <label
                key={step.id}
                className="flex min-h-12 cursor-pointer gap-3 rounded-xl border border-slate-200 p-3"
              >
                <input
                  type="checkbox"
                  checked={Boolean(completed[taskKey(selected.id, step.id)])}
                  onChange={(event) => toggleStep(step.id, event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0"
                />
                <span className="space-y-1">
                  <span className="block font-semibold">{step.label}</span>
                  <span className="block text-sm text-slate-700">
                    {step.guidance}
                  </span>
                </span>
              </label>
            ))}
            <p role="status" aria-live="polite" className="text-sm text-slate-700">
              {completedCount} of {selected.steps.length} practice steps marked.
              This is not a verified result.
            </p>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <Link
              href={challengeFieldNotesHref(selected)}
              className={"inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0C1833] px-4 py-3 font-bold text-white " + mapableInteractiveFocusRing}
            >
              Open local Field Notes
            </Link>
            <button
              type="button"
              onClick={clearSelection}
              className={"min-h-12 rounded-xl border border-slate-400 px-4 py-3 font-semibold " + mapableInteractiveFocusRing}
            >
              Clear local checklist
            </button>
          </div>
          <p className="text-sm text-slate-600" aria-live="polite">
            {statusMessage || "Field Notes is also a local draft only: nothing is submitted or reviewed."}
          </p>
        </section>
      </div>

      <section
        aria-labelledby="mapping-safety-heading"
        className="space-y-3 rounded-2xl bg-[#F0F6F9] p-5 sm:p-6"
      >
        <h2 id="mapping-safety-heading" className="font-heading text-xl font-bold">
          Safe, voluntary participation
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-slate-800">
          {CHALLENGE_SAFETY_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="text-sm">
          <Link
            href="/mapping-days"
            className={"font-bold text-[#005B7F] underline " + mapableInteractiveFocusRing}
          >
            Learn about MapAble Mapping Days
          </Link>{" "}
          (the page currently contains dated demonstration events, not open
          registrations).
        </p>
      </section>
    </div>
  );
}
