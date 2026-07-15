"use client";

import React, { useMemo, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

type Answer = "yes" | "partial" | "no" | "unsure";

type Question = {
  id: string;
  label: string;
  barrier: string;
  strengthLabel: string;
  barrierLabel: string;
  lowCostFix: string;
};

const QUESTIONS: Question[] = [
  {
    id: "entrance",
    label: "Is there a clear, published way to find the main or step-free entrance?",
    barrier: "physical",
    strengthLabel: "Entrance information is clearer for arrivals",
    barrierLabel: "Entrance wayfinding is unclear or unpublished",
    lowCostFix: "Add a short entrance note and photo to your visit or contact page.",
  },
  {
    id: "step",
    label: "Can people avoid steps or high thresholds when entering, or request a documented alternative?",
    barrier: "physical",
    strengthLabel: "Step / threshold options are considered",
    barrierLabel: "Steps or thresholds block independent entry",
    lowCostFix: "Document the alternate entrance process and who unlocks or assists.",
  },
  {
    id: "door",
    label: "Are main customer doors wide enough for common mobility aids, or can staff assist promptly?",
    barrier: "physical",
    strengthLabel: "Door width / assistance options are planned",
    barrierLabel: "Door width or heavy doors create a barrier",
    lowCostFix: "Note door type online and train staff on prompt assistance.",
  },
  {
    id: "path",
    label: "Is the path from entrance to service areas usually clear of clutter and temporary obstacles?",
    barrier: "physical",
    strengthLabel: "Path of travel is usually kept clear",
    barrierLabel: "Path of travel is often blocked or unpredictable",
    lowCostFix: "Create a daily clear-path check for aisles, mats and displays.",
  },
  {
    id: "toilet",
    label: "Can you describe an accessible toilet option (location, hours, step-free notes) without guessing?",
    barrier: "toilet",
    strengthLabel: "Toilet access information can be described",
    barrierLabel: "Toilet access information is missing or unverified",
    lowCostFix: "Publish toilet location and ask/verify notes on your website.",
  },
  {
    id: "seating",
    label: "Is there seating or rest options for people who need to pause during a visit?",
    barrier: "physical",
    strengthLabel: "Rest seating options exist",
    barrierLabel: "Limited or no rest seating along customer journeys",
    lowCostFix: "Provide at least one marked rest seat near reception or queues.",
  },
  {
    id: "sensory",
    label: "Can customers request lower noise/lighting load, or use a quieter waiting option?",
    barrier: "sensory",
    strengthLabel: "Sensory load options can be offered",
    barrierLabel: "Noise or lighting load has no quieter alternative",
    lowCostFix: "Offer a quieter wait spot and brief staff on request handling.",
  },
  {
    id: "staff",
    label: "Are staff briefed on how to respond to assistance requests calmly and respectfully?",
    barrier: "attitudinal",
    strengthLabel: "Staff assistance briefing is in place",
    barrierLabel: "Staff assistance responses are inconsistent",
    lowCostFix: "Add a one-page accessible service brief to induction and shift notes.",
  },
  {
    id: "online",
    label: "Is access information easy to find online before people travel?",
    barrier: "digital",
    strengthLabel: "Online access information is findable",
    barrierLabel: "Online access information is hard to find or missing",
    lowCostFix: "Add an Access information link from your home or visit page.",
  },
  {
    id: "feedback",
    label: "Is there a clear way to report an access issue and hear what changed?",
    barrier: "feedback",
    strengthLabel: "Access feedback channel is clear",
    barrierLabel: "No clear complaint or access-update process",
    lowCostFix: "Publish one monitored email/form and a simple acknowledgement timeline.",
  },
];

const ANSWER_OPTIONS: Array<{ value: Answer; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "partial", label: "Partly" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

function scoreAnswer(answer: Answer | undefined): number {
  switch (answer) {
    case "yes":
      return 2;
    case "partial":
      return 1;
    case "no":
      return 0;
    case "unsure":
      return 0;
    default:
      return -1;
  }
}

export function BusinessAccessSelfCheckForm() {
  const [answers, setAnswers] = useState<Partial<Record<string, Answer>>>({});
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    const scored = QUESTIONS.map((question) => ({
      question,
      score: scoreAnswer(answers[question.id]),
      answer: answers[question.id],
    }));

    const strengths = scored
      .filter((item) => item.score >= 2)
      .map((item) => item.question.strengthLabel);

    const barriers = scored
      .filter((item) => item.score >= 0 && item.score < 2)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((item) => item.question.barrierLabel);

    const lowCostFixes = scored
      .filter((item) => item.score >= 0 && item.score < 2)
      .slice(0, 5)
      .map((item) => item.question.lowCostFix);

    const answeredCount = scored.filter((item) => item.score >= 0).length;
    const totalScore = scored.reduce(
      (sum, item) => sum + Math.max(item.score, 0),
      0,
    );
    const readiness =
      answeredCount === 0
        ? "Answer the questions to see an accreditation readiness note."
        : totalScore >= 16
          ? "Readiness note: you may have enough practical notes to start a MapAble Accreditation conversation, but this self-check is not a certificate or legal compliance outcome."
          : totalScore >= 10
            ? "Readiness note: useful foundations are forming. Focus on the top barriers and publish honest access information before seeking formal review."
            : "Readiness note: prioritise the top barriers and low-cost fixes first. MapAble Accreditation readiness needs clearer evidence and published access notes.";

    return { strengths, barriers, lowCostFixes, readiness, answeredCount };
  }, [answers]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className={`${mapablePublicCardClass} space-y-6`}
        noValidate
      >
        <div>
          <h2 className="text-lg font-black text-[#0C1833]">
            Self-check questions
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Choose the closest answer. Essential guidance stays in plain text
            below even if you skip the form.
          </p>
        </div>

        {QUESTIONS.map((question, index) => (
          <fieldset key={question.id} className="space-y-3">
            <legend className="text-sm font-black text-[#0C1833]">
              {index + 1}. {question.label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {ANSWER_OPTIONS.map((option) => {
                const selected = answers[question.id] === option.value;
                return (
                  <label
                    key={option.value}
                    className={`${mapableCareFocusRing} inline-flex min-h-11 cursor-pointer items-center rounded-2xl border px-4 text-sm font-bold ${
                      selected
                        ? "border-[#005B7F] bg-[#005B7F] text-white"
                        : "border-slate-200 bg-white text-[#005B7F]"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={question.id}
                      value={option.value}
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: option.value,
                        }))
                      }
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
          >
            Show my results
          </button>
          <button
            type="button"
            className={`${mapablePublicSecondaryButtonClass} ${mapableCareFocusRing}`}
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Clear answers
          </button>
        </div>
      </form>

      <section
        id="self-check-results"
        aria-labelledby="self-check-results-heading"
        className="space-y-4"
        aria-live="polite"
      >
        <h2
          id="self-check-results-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          Results
        </h2>
        {!submitted ? (
          <p className="text-sm leading-7 text-slate-700">
            Complete the questions and choose “Show my results” to see strengths,
            top barriers, low-cost fixes and an accreditation readiness note.
          </p>
        ) : results.answeredCount === 0 ? (
          <p className="text-sm leading-7 text-slate-700">
            Select at least one answer to generate guidance.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={mapablePublicCardClass}>
              <h3 className="font-black text-[#0C1833]">
                Strongest access features
              </h3>
              {results.strengths.length === 0 ? (
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  No clear strengths yet — that’s useful information. Start with
                  low-cost fixes.
                </p>
              ) : (
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                  {results.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className={mapablePublicCardClass}>
              <h3 className="font-black text-[#0C1833]">
                Top barriers to reduce
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                {results.barriers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={mapablePublicCardClass}>
              <h3 className="font-black text-[#0C1833]">Low-cost fixes</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                {results.lowCostFixes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={mapablePublicCardClass}>
              <h3 className="font-black text-[#0C1833]">Suggested next steps</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                <li>Publish what you already know in plain language.</li>
                <li>
                  Assign a named owner for access information and feedback.
                </li>
                <li>
                  Re-run this self-check after one or two changes are in place.
                </li>
                <li>
                  Use the Access Statement Generator to share honest notes.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                {results.readiness}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
