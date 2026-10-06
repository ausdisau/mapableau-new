"use client";

import Link from "next/link";

import {
  nextConversationalCandidate,
  setGoalPlanDecision,
  type GoalPlanDraft,
  type ParticipantDecision,
} from "@mapable/contracts";

const DECISION_LABELS: Record<ParticipantDecision, string> = {
  undecided: "Not yet decided",
  yes: "Included",
  no: "Not included",
  not_sure: "Not sure",
};

const MODULE_LABELS = {
  access: "Access",
  care: "Care",
  transport: "Transport",
  jobs: "Jobs",
} as const;

type Props = {
  plan: GoalPlanDraft;
  onChange: (plan: GoalPlanDraft) => void;
  nonAiHref?: string;
};

function decisionButtonLabel(decision: Exclude<ParticipantDecision, "undecided">) {
  if (decision === "not_sure") return "Not sure";
  return decision === "yes" ? "Yes" : "No";
}

export function GoalPlanPanel({
  plan,
  onChange,
  nonAiHref = "/provider-finder",
}: Props) {
  const active = nextConversationalCandidate(plan);

  const updateDecision = (
    module: GoalPlanDraft["serviceCandidates"][number]["module"],
    decision: Exclude<ParticipantDecision, "undecided">,
  ) => {
    onChange(setGoalPlanDecision(plan, module, decision));
  };

  return (
    <section
      aria-labelledby="goal-plan-heading"
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
          Participant-controlled draft
        </p>
        <h2 id="goal-plan-heading" className="text-2xl font-black tracking-[-0.03em] text-[#0C1833]">
          My Goal Plan
        </h2>
        <p className="text-sm text-slate-600">Your goal, in your words:</p>
        <p className="rounded-xl bg-slate-50 p-4 text-base font-semibold leading-6 text-slate-900">
          {plan.goal}
        </p>
        <p className="text-sm text-slate-600" role="note">
          Nothing is booked or shared from this draft.
        </p>
      </div>

      {plan.serviceCandidates.length > 0 ? (
        <ul className="grid gap-3" aria-label="Suggested MapAble services">
          {plan.serviceCandidates.map((candidate) => (
            <li
              key={candidate.module}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {MODULE_LABELS[candidate.module]}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {candidate.reasonSuggested}
                  </p>
                </div>
                <span
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  aria-label={`${MODULE_LABELS[candidate.module]}: ${DECISION_LABELS[candidate.decision]}`}
                >
                  {DECISION_LABELS[candidate.decision]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {candidate.participantBenefit}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {active ? (
        <section
          aria-labelledby="goal-plan-question"
          className="space-y-3 rounded-xl border border-[#005B7F]/20 bg-[#F6FBFC] p-4"
        >
          <h3 id="goal-plan-question" className="font-bold text-[#0C1833]">
            Ask MapAble
          </h3>
          <p className="text-sm leading-6 text-slate-800">{active.question}</p>
          <div
            role="group"
            aria-label={`Choices for ${MODULE_LABELS[active.module]}`}
            className="flex flex-wrap gap-2"
          >
            {(["yes", "no", "not_sure"] as const).map((decision) => (
              <button
                key={decision}
                type="button"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => updateDecision(active.module, decision)}
              >
                {decisionButtonLabel(decision)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-[#005B7F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Talk to a person
        </Link>
        <Link
          href={nonAiHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-[#005B7F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse without AI
        </Link>
      </div>
    </section>
  );
}
