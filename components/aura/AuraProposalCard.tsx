"use client";

import { useId, useState } from "react";

type DisclosureField = {
  key: string;
  label: string;
  valuePreview: string;
  reason: string;
};

type Proposal = {
  id: string;
  version: number;
  actionType: string;
  risk: string;
  state: string;
  purpose: { code: string; plainLanguage: string };
  target: { recipientLabel: string; applicationService: string };
  disclosure: {
    fieldsShared: DisclosureField[];
    fieldsOmitted: DisclosureField[];
  };
  expectedResult: string;
  possibleFailures: string[];
  fallbackPlan: string[];
  expiresAt: string;
  proposalHash: string;
};

export function AuraExecutionDisabledNotice() {
  return (
    <p
      role="status"
      className="rounded border border-amber-700 bg-amber-50 px-3 py-2 text-sm text-amber-950"
    >
      Shadow mode: AURA will not send, book, publish, notify or change anything.
      Accepting a proposal is for evaluation only — not execution approval.
    </p>
  );
}

export function AuraProposalCard({
  missionId,
  onBusy,
}: {
  missionId: string;
  onBusy?: (busy: boolean) => void;
}) {
  const headingId = useId();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createProposal(actionType: string) {
    onBusy?.(true);
    setError(null);
    setReceipt(null);
    try {
      const res = await fetch(
        `/api/intelligence/aura/missions/${missionId}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionType }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Proposal failed");
        return;
      }
      setProposal(data.proposal);
      setMessage(data.notice);
    } finally {
      onBusy?.(false);
    }
  }

  async function acceptForShadow() {
    if (!proposal) return;
    onBusy?.(true);
    setError(null);
    try {
      const reviewRes = await fetch(
        `/api/intelligence/aura/proposals/${proposal.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "accepted_for_shadow" }),
        },
      );
      const reviewData = await reviewRes.json();
      if (!reviewRes.ok) {
        setError(reviewData.error || "Review failed");
        return;
      }
      const shadowRes = await fetch(
        `/api/intelligence/aura/proposals/${proposal.id}/shadow-evaluate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId: reviewData.review.id }),
        },
      );
      const shadowData = await shadowRes.json();
      if (!shadowRes.ok) {
        setError(shadowData.error || "Shadow evaluation failed");
        return;
      }
      setProposal(shadowData.evaluation ? proposal : proposal);
      setReceipt(
        `${shadowData.receipt.notice} Status: ${shadowData.receipt.status}. executionAttempted=${shadowData.executionAttempted}. externalSideEffects=${shadowData.externalSideEffects}.`,
      );
      setMessage(shadowData.notice);
      // refresh proposal state
      const getRes = await fetch(
        `/api/intelligence/aura/proposals/${proposal.id}`,
      );
      const getData = await getRes.json();
      if (getRes.ok) setProposal(getData.proposal);
    } finally {
      onBusy?.(false);
    }
  }

  async function decline() {
    if (!proposal) return;
    onBusy?.(true);
    try {
      const res = await fetch(
        `/api/intelligence/aura/proposals/${proposal.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision: "declined" }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Decline failed");
        return;
      }
      setMessage("Proposal declined. No external action was performed.");
      const getRes = await fetch(
        `/api/intelligence/aura/proposals/${proposal.id}`,
      );
      const getData = await getRes.json();
      if (getRes.ok) setProposal(getData.proposal);
    } finally {
      onBusy?.(false);
    }
  }

  async function reviseOmitArrival() {
    if (!proposal) return;
    onBusy?.(true);
    try {
      const res = await fetch(
        `/api/intelligence/aura/proposals/${proposal.id}/revise`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ omitArrivalTime: true }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Revision failed");
        return;
      }
      setProposal(data.proposal);
      setMessage(
        `Version ${data.proposal.version} created. New shadow review required. ${data.notice}`,
      );
      setReceipt(null);
    } finally {
      onBusy?.(false);
    }
  }

  return (
    <section aria-labelledby={headingId} className="space-y-3 rounded border border-slate-300 p-4">
      <h2 id={headingId} className="text-lg font-semibold">
        Action proposals (shadow only)
      </h2>
      <AuraExecutionDisabledNotice />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded bg-slate-800 px-3 py-2 text-sm text-white"
          onClick={() => createProposal("venue_verification_request")}
        >
          Propose venue verification
        </button>
        <button
          type="button"
          className="min-h-11 rounded bg-slate-800 px-3 py-2 text-sm text-white"
          onClick={() => createProposal("transport_request")}
        >
          Propose transport request
        </button>
        <button
          type="button"
          className="min-h-11 rounded bg-slate-800 px-3 py-2 text-sm text-white"
          onClick={() => createProposal("supporter_notification")}
        >
          Propose supporter notification
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      {proposal ? (
        <article className="space-y-3 border-t border-slate-200 pt-3">
          <h3 className="font-semibold">
            {proposal.actionType.replaceAll("_", " ")} — v{proposal.version}
          </h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Purpose</dt>
              <dd>{proposal.purpose.plainLanguage}</dd>
            </div>
            <div>
              <dt className="font-medium">Recipient</dt>
              <dd>{proposal.target.recipientLabel}</dd>
            </div>
            <div>
              <dt className="font-medium">Risk</dt>
              <dd>{proposal.risk}</dd>
            </div>
            <div>
              <dt className="font-medium">Status</dt>
              <dd>
                <span className="font-medium">{proposal.state}</span>
              </dd>
            </div>
            <div>
              <dt className="font-medium">Expires</dt>
              <dd>{proposal.expiresAt}</dd>
            </div>
          </dl>

          <div>
            <h4 className="font-medium">Information that would be shared</h4>
            <ul className="list-disc pl-5 text-sm">
              {proposal.disclosure.fieldsShared.map((f) => (
                <li key={f.key}>
                  <strong>{f.label}:</strong> {f.valuePreview} — {f.reason}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Information that would not be shared</h4>
            <ul className="list-disc pl-5 text-sm">
              {proposal.disclosure.fieldsOmitted.map((f) => (
                <li key={f.key}>
                  <strong>{f.label}:</strong> {f.valuePreview}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Expected result</h4>
            <p className="text-sm">{proposal.expectedResult}</p>
          </div>
          <div>
            <h4 className="font-medium">Possible failures</h4>
            <ul className="list-disc pl-5 text-sm">
              {proposal.possibleFailures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Fallback</h4>
            <ul className="list-disc pl-5 text-sm">
              {proposal.fallbackPlan.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          {proposal.state === "ready_for_review" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-11 rounded bg-emerald-800 px-3 py-2 text-sm text-white"
                onClick={acceptForShadow}
              >
                Accept for shadow evaluation
              </button>
              <button
                type="button"
                className="min-h-11 rounded border border-slate-500 px-3 py-2 text-sm"
                onClick={decline}
              >
                Decline
              </button>
              <button
                type="button"
                className="min-h-11 rounded border border-slate-500 px-3 py-2 text-sm"
                onClick={reviseOmitArrival}
              >
                Request a change (omit arrival time)
              </button>
            </div>
          ) : null}

          {receipt ? (
            <p role="status" className="rounded bg-slate-100 p-2 text-sm">
              {receipt}
            </p>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
