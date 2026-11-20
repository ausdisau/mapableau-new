"use client";

import { useMemo, useState } from "react";

import {
  MyDayResilienceEngine,
  type MyDayResilienceState,
  type UserDecisionKind,
} from "@/lib/my-day-resilience";

const buttonClass =
  "min-h-11 rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass =
  "min-h-11 rounded-lg border-2 border-[#005B7F] bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50 disabled:cursor-not-allowed disabled:opacity-50";

function honestyLabel(honesty: string): string {
  return honesty.toUpperCase();
}

export function MyDayResilienceSimulator() {
  const engine = useMemo(() => new MyDayResilienceEngine({ consentGranted: false }), []);
  const [state, setState] = useState<MyDayResilienceState>(() => engine.getState());
  const [goalDraft, setGoalDraft] = useState(state.plan.goalStatement);
  const [status, setStatus] = useState(
    "Synthetic demo only. Grant consent to begin. Nothing is booked or paid.",
  );
  const [replayText, setReplayText] = useState("");
  const [showOffline, setShowOffline] = useState(false);

  function refresh(next: MyDayResilienceState, message: string) {
    setState(next);
    setStatus(message);
  }

  function runSafe(action: () => MyDayResilienceState, okMessage: string) {
    try {
      refresh(action(), okMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed";
      setStatus(message);
      setState(engine.getState());
    }
  }

  function decide(kind: UserDecisionKind, proposalId?: string) {
    runSafe(
      () => engine.applyDecision(kind, proposalId),
      kind === "decline"
        ? "Proposal declined and will not reappear."
        : `Decision recorded: ${kind}`,
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-bold text-[#0C1833]">
          My Day Resilience Simulator
        </h1>
        <p className="text-slate-700">
          Plan a synthetic day: work, shops, and return with your usual worker.
          Disruptions are fictional. You stay in control of every choice.
        </p>
        <p
          role="status"
          className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 font-semibold text-[#0C1833]"
        >
          DEMO ONLY: fictional workers and transport. No live screening, bookings,
          payments, government APIs, or personal participant data.
        </p>
      </header>

      <p className="text-sm" aria-live="polite" id="my-day-status">
        {status}
      </p>
      <p className="text-sm font-semibold text-[#0C1833]" aria-live="polite">
        Next action: {state.nextActionLabel}
      </p>

      <section
        aria-labelledby="consent-heading"
        className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 sm:p-6"
      >
        <h2 id="consent-heading" className="text-xl font-bold">
          1. Consent for this synthetic demo
        </h2>
        <p className="text-sm text-slate-700">
          Purpose-specific consent for the My Day Resilience synthetic demo only.
          You can deny or withdraw at any time. No real consent records are written.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={primaryClass}
            onClick={() =>
              runSafe(() => engine.grantConsent(), "Consent granted for synthetic demo.")
            }
          >
            Grant demo consent
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() =>
              runSafe(() => engine.denyConsent(), "Consent denied — journey blocked.")
            }
          >
            Deny consent
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() =>
              runSafe(
                () => engine.withdrawConsent(),
                "Consent withdrawn — options invalidated.",
              )
            }
          >
            Withdraw consent
          </button>
        </div>
        <p className="text-sm">
          Status:{" "}
          <strong>
            {state.consent.granted
              ? state.consent.withdrawnAt
                ? "withdrawn"
                : "granted"
              : "denied"}
          </strong>{" "}
          · Phase: <strong>{state.phase}</strong>
        </p>
      </section>

      <section
        aria-labelledby="plan-heading"
        className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 sm:p-6"
      >
        <h2 id="plan-heading" className="text-xl font-bold">
          2. Editable My Day plan (list view — no map required)
        </h2>
        <label className="block space-y-2">
          <span className="font-semibold">Goal statement</span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-slate-400 p-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50"
            value={goalDraft}
            onChange={(event) => setGoalDraft(event.target.value)}
            disabled={!state.consent.granted || state.phase === "blocked"}
          />
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={state.phase !== "plan_edit"}
          onClick={() =>
            runSafe(
              () => engine.updateGoal(goalDraft),
              "Goal updated in the synthetic plan.",
            )
          }
        >
          Save goal edits
        </button>
        <ol className="list-decimal space-y-3 pl-5">
          {state.plan.steps.map((step) => (
            <li key={step.id} className="rounded-lg border border-slate-200 p-3">
              <strong>{step.label}</strong>
              <span className="block text-sm text-slate-700">
                {step.destinationLabel} · Support needed:{" "}
                {step.supportNeeded ? "yes" : "no"} · Transport proposed:{" "}
                {step.transportRequired ? "yes (not booked)" : "no"}
              </span>
              <span className="block text-sm text-slate-700">
                Communication: {step.communicationNeeds.join(", ") || "none declared"}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={primaryClass}
            disabled={state.phase !== "plan_edit"}
            onClick={() =>
              runSafe(
                () => engine.evaluateDependencies(),
                "Dependencies evaluated with labelled evidence.",
              )
            }
          >
            Evaluate dependencies
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={state.phase !== "scenario_ready"}
            onClick={() =>
              runSafe(
                () => engine.injectPreferredWorkerCancellation("delayed_pickup"),
                "Preferred worker cancelled; transport re-evaluated.",
              )
            }
          >
            Simulate preferred worker cancellation
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={state.phase !== "scenario_ready"}
            onClick={() =>
              runSafe(
                () => engine.injectPreferredWorkerCancellation("vehicle_mismatch"),
                "Worker cancel plus inaccessible/mismatched transport injected.",
              )
            }
          >
            Simulate cancel + vehicle mismatch
          </button>
        </div>
      </section>

      <section
        aria-labelledby="evidence-heading"
        className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 sm:p-6"
      >
        <h2 id="evidence-heading" className="text-xl font-bold">
          3. Evidence (honesty labelled)
        </h2>
        {state.evidence.length === 0 ? (
          <p className="text-sm text-slate-700">No evidence yet.</p>
        ) : (
          <ul className="space-y-2">
            {state.evidence.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <span className="font-bold">{item.topic}</span>
                <span className="ml-2 inline-block rounded border border-slate-400 px-2 py-0.5 text-xs font-bold">
                  {honestyLabel(item.honesty)}
                </span>
                <span className="mt-1 block text-slate-700">{item.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="recovery-heading"
        className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 sm:p-6"
      >
        <h2 id="recovery-heading" className="text-xl font-bold">
          4. Recovery choices (participant approval required)
        </h2>
        <p className="text-sm text-slate-700">
          Every option requires your approval. Nothing executes automatically.
          Declined options are removed and cannot reappear.
        </p>
        {state.proposals.length === 0 ? (
          <p className="text-sm text-slate-700">No recovery proposals yet.</p>
        ) : (
          <ul className="space-y-4">
            {state.proposals.map((proposal) => (
              <li key={proposal.id} className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-bold">{proposal.label}</h3>
                <p className="mt-1 text-sm text-slate-700">{proposal.explanation}</p>
                <p className="mt-1 text-xs text-slate-600">
                  verifiedInScenario={String(proposal.verifiedInScenario)} · canExecute=
                  {String(proposal.canExecute)} · humanReview=
                  {String(proposal.humanReviewRequired)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={primaryClass}
                    disabled={
                      state.phase !== "recovery_options" &&
                      state.phase !== "human_escalation"
                    }
                    onClick={() => decide("accept", proposal.id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={state.phase !== "recovery_options"}
                    onClick={() => decide("decline", proposal.id)}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={state.phase !== "recovery_options"}
                    onClick={() => decide("defer", proposal.id)}
                  >
                    Defer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={buttonClass}
            disabled={!state.consent.granted || state.phase === "blocked"}
            onClick={() => decide("request_human_help")}
          >
            Request human help
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={!state.consent.granted || state.phase === "blocked"}
            onClick={() =>
              runSafe(
                () => engine.withdrawPreferredWorker(),
                "Preferred worker preference withdrawn.",
              )
            }
          >
            Withdraw preferred worker preference
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={state.phase !== "recovery_options"}
            onClick={() => decide("edit")}
          >
            Edit plan
          </button>
        </div>
      </section>

      <section
        aria-labelledby="receipt-heading"
        className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 sm:p-6"
      >
        <h2 id="receipt-heading" className="text-xl font-bold">
          5. Decision receipt and replay
        </h2>
        {state.receipt ? (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Receipt ID:</strong> {state.receipt.receiptId}
            </p>
            <p>
              <strong>Chosen:</strong> {state.receipt.chosenProposalId ?? "none"}
            </p>
            <p>
              <strong>Rejected:</strong>{" "}
              {state.receipt.rejectedProposalIds.join(", ") || "none"}
            </p>
            {state.receipt.escalationReason ? (
              <p>
                <strong>Escalation:</strong> {state.receipt.escalationReason}
              </p>
            ) : null}
            <ul className="list-disc pl-5">
              {state.receipt.explainability.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-700">No receipt issued yet.</p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              const result = engine.replay();
              setReplayText(
                `Reconstructed phase: ${result.reconstructedPhase}; equalToLive=${result.equalToLive}; events=${result.events.length}`,
              );
            }}
          >
            Replay scenario from event log
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => setShowOffline((value) => !value)}
          >
            {showOffline ? "Hide" : "Show"} offline-readable summary
          </button>
        </div>
        {replayText ? (
          <p className="text-sm" aria-live="polite">
            {replayText}
          </p>
        ) : null}
        {showOffline ? (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            {engine.offlineSummary()}
          </pre>
        ) : null}
      </section>

      <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          Irreversible actions remain blocked: canBook={String(state.canBook)},
          autoBooking={String(state.permanentDeny.autoBooking)}, productionClaim=
          {state.productionClaim}.
        </p>
      </aside>
    </div>
  );
}
