"use client";

import type { DecisionPassport } from "@/lib/ai/platform/decision-passport/types";

type Props = {
  passport: DecisionPassport;
  onRequestHumanReview?: () => void;
  onContinueNonAi?: () => void;
  onWithdrawConsent?: () => void;
};

/**
 * Accessible Decision Passport summary. No hidden chain-of-thought.
 * Prefer participant controls over AI commentary.
 */
export function DecisionPassportPanel({
  passport,
  onRequestHumanReview,
  onContinueNonAi,
  onWithdrawConsent,
}: Props) {
  return (
    <section
      aria-labelledby="decision-passport-heading"
      className="mx-auto max-w-3xl space-y-6 px-4 py-6"
    >
      <header className="space-y-2">
        <p className="text-sm font-medium text-stone-600">Decision Passport</p>
        <h2
          id="decision-passport-heading"
          className="text-2xl font-semibold tracking-tight text-stone-900"
        >
          Your provider search summary
        </h2>
        <p className="text-base text-stone-700">{passport.requestedSummary}</p>
      </header>

      <div className="space-y-2">
        <h3 className="text-lg font-medium text-stone-900">
          Suggested providers
        </h3>
        {passport.suggestedProviders.length === 0 ? (
          <p role="status" className="text-stone-700">
            No providers met your non-negotiable requirements. Constraints were
            not relaxed.
          </p>
        ) : (
          <ul className="space-y-3">
            {passport.suggestedProviders.map((provider) => (
              <li key={provider.sourceId} className="border-b border-stone-200 pb-3">
                <p className="font-medium text-stone-900">{provider.name}</p>
                <p className="text-sm text-stone-600">
                  Reasons: {provider.reasons.join("; ") || "Deterministic match"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium text-stone-900">
          Missing or stale information
        </h3>
        <ul className="list-disc pl-5 text-stone-700">
          {passport.missingOrStaleInformation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium text-stone-900">AI involvement</h3>
        <p className="text-stone-700">
          {passport.aiInvolvement.used
            ? "AI helped interpret your request. Matching used deterministic rules."
            : "Matching used deterministic rules only. AI commentary was not required."}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium text-stone-900">Proposed next step</h3>
        <p className="text-stone-700">{passport.proposedNextAction.summary}</p>
        <p className="text-sm text-stone-600">
          Approver required: {passport.requiredApproverRole}
        </p>
      </div>

      <div
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        role="group"
        aria-label="Participant controls"
      >
        <button
          type="button"
          className="rounded-md bg-stone-900 px-4 py-3 text-left text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          onClick={onRequestHumanReview}
        >
          Request a person
        </button>
        <button
          type="button"
          className="rounded-md border border-stone-400 px-4 py-3 text-left text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          onClick={onContinueNonAi}
        >
          Continue without AI
        </button>
        <button
          type="button"
          className="rounded-md border border-stone-400 px-4 py-3 text-left text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          onClick={onWithdrawConsent}
        >
          Withdraw consent
        </button>
      </div>
    </section>
  );
}
