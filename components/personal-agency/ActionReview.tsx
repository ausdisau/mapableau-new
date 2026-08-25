"use client";

import { useState } from "react";

import { AgencyConfirmation } from "@/components/personal-agency/AgencyConfirmation";
import type {
  MapAbleActionProposal,
  MapAbleActionResult,
} from "@/lib/ai/platform/actions";
import type { AgencyConsequenceKind } from "@/lib/personal-agency/agency-copy";

export type ActionReviewProps = {
  missionId: string;
  missionProposalId?: string;
  actionKey: MapAbleActionProposal["actionKey"];
  purpose: string;
  informationToShare: string[];
  consentScopes: string[];
  payload: Record<string, unknown>;
  consequenceKinds?: AgencyConsequenceKind[];
  onComplete?: (result: MapAbleActionResult) => void;
  onCancel?: () => void;
};

type ApprovalState = {
  approvalId: string;
  nonce: string;
  payloadHash: string;
};

/**
 * Mission → Recommendation → Prepare → Review → Approve/Reject → Execute → Result
 * Explicit labels; no dark patterns.
 */
export function ActionReview({
  missionId,
  missionProposalId,
  actionKey,
  purpose,
  informationToShare,
  consentScopes,
  payload,
  consequenceKinds = ["CONTACT", "SHARE"],
  onComplete,
  onCancel,
}: ActionReviewProps) {
  const [step, setStep] = useState<
    "prepare" | "review" | "approved" | "result" | "rejected"
  >("prepare");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<MapAbleActionProposal | null>(null);
  const [approval, setApproval] = useState<ApprovalState | null>(null);
  const [result, setResult] = useState<MapAbleActionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#005B7F] bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-50";
  const primaryClass =
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-50";

  async function prepareProposal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/actions/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          traceId: crypto.randomUUID(),
          actionKey,
          payload,
          informationToShare,
          purpose,
          consentScopes,
          missionProposalId: missionProposalId ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        proposal?: MapAbleActionProposal;
      };
      if (!res.ok || !data.proposal) {
        setError(data.error ?? "Could not prepare this action.");
        return;
      }
      setProposal(data.proposal);
      setStep("review");
      setConfirmOpen(true);
    } catch {
      setError("Network error while preparing the action.");
    } finally {
      setBusy(false);
    }
  }

  async function approveProposal() {
    if (!proposal) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ai/actions/proposals/${proposal.proposalId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consentScopes,
            confirmedInformationToShare: informationToShare,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        approval?: ApprovalState;
      };
      if (!res.ok || !data.approval) {
        setError(data.error ?? "Approval failed.");
        return;
      }
      setApproval(data.approval);
      setConfirmOpen(false);
      setStep("approved");
    } catch {
      setError("Network error while approving.");
    } finally {
      setBusy(false);
    }
  }

  async function rejectProposal() {
    if (!proposal) return;
    setBusy(true);
    try {
      await fetch(`/api/ai/actions/proposals/${proposal.proposalId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Participant declined" }),
      });
      setConfirmOpen(false);
      setStep("rejected");
      onCancel?.();
    } finally {
      setBusy(false);
    }
  }

  async function executeProposal() {
    if (!proposal || !approval) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ai/actions/proposals/${proposal.proposalId}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId: proposal.proposalId,
            approvalId: approval.approvalId,
            nonce: approval.nonce,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        result?: MapAbleActionResult;
      };
      if (!res.ok || !data.result) {
        setError(data.error ?? "Execution failed.");
        return;
      }
      setResult(data.result);
      setStep("result");
      onComplete?.(data.result);
    } catch {
      setError("Network error while executing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="action-review-heading"
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <h3 id="action-review-heading" className="text-sm font-bold text-[#0C1833]">
        Action review
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        MapAble will only proceed after you review and approve. You can reject
        at any time.
      </p>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Purpose:</span> {purpose}
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {step === "prepare" ? (
        <button
          type="button"
          className={`${primaryClass} mt-3`}
          disabled={busy}
          onClick={() => void prepareProposal()}
        >
          {busy ? "Preparing…" : "Prepare this action for review"}
        </button>
      ) : null}

      {step === "approved" && approval ? (
        <div className="mt-3 space-y-2">
          <p role="status" className="text-sm font-semibold text-green-800">
            Approved for the exact details you reviewed.
          </p>
          <button
            type="button"
            className={primaryClass}
            disabled={busy}
            onClick={() => void executeProposal()}
          >
            {busy ? "Submitting…" : "Submit approved action"}
          </button>
          <button
            type="button"
            className={`${buttonClass} ml-2`}
            disabled={busy}
            onClick={() => {
              setStep("rejected");
              onCancel?.();
            }}
          >
            Cancel without submitting
          </button>
        </div>
      ) : null}

      {step === "result" && result ? (
        <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
          <p role="status" className="text-sm font-semibold text-green-900">
            {result.missionFeedback}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Status: {result.status}. This is a request or message outcome — not
            a confirmed booking, payment, or worker assignment.
          </p>
        </div>
      ) : null}

      {step === "rejected" ? (
        <p role="status" className="mt-3 text-sm text-slate-700">
          You rejected this action. Nothing was submitted.
        </p>
      ) : null}

      <AgencyConfirmation
        open={confirmOpen}
        title="Before MapAble does this"
        actionLabel={purpose}
        informationShared={informationToShare}
        informationNotShared={[
          "Diagnosis or clinical notes (unless you typed them)",
          "Payment or funding changes",
          "Worker assignment",
        ]}
        consequenceKinds={consequenceKinds}
        onApprove={() => void approveProposal()}
        onChange={() => {
          setConfirmOpen(false);
          setStep("prepare");
        }}
        onCancel={() => void rejectProposal()}
      />
    </section>
  );
}
