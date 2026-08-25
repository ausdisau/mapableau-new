"use client";

import { useId, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import type { OperatorReviewView } from "@/lib/ai/platform/human-operations";
import { HUMAN_OPS_A11Y } from "@/lib/ai/platform/human-operations";

type AuditRow = {
  auditId: string;
  action: string;
  actorId: string;
  at: string;
};

export function HumanOpsReviewDetail({
  initialReview,
  initialAudit,
}: {
  initialReview: OperatorReviewView;
  initialAudit: AuditRow[];
}) {
  const formId = useId();
  const [review, setReview] = useState(initialReview);
  const [audit, setAudit] = useState(initialAudit);
  const [assigneeId, setAssigneeId] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const [resolution, setResolution] = useState("continue_workflow");
  const [resolutionReason, setResolutionReason] = useState("");
  const [authority, setAuthority] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/ai/human-ops/reviews/${review.reviewId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.review) setReview(data.review);
    if (data.audit) setAudit(data.audit);
  }

  async function post(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setStatusMsg(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      if (data.review) setReview(data.review);
      setStatusMsg(data.note ?? "Saved.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="space-y-6"
      aria-label={HUMAN_OPS_A11Y.reviewLandmark}
    >
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          Review {review.reviewId}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground" role="note">
          {review.authorityReminder}
        </p>
        {review.safeguardingBoundaryActive ? (
          <p className="rounded border border-amber-600/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-50" role="status">
            Safeguarding boundary active: AI must not determine substantiation,
            reportability, sanction, restrictive-practice approval, or incident
            closure. This console will reject forbidden resolutions.
          </p>
        ) : null}
      </header>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</dt>
          <dd>{review.category}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</dt>
          <dd>{review.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</dt>
          <dd>{review.priority}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned to</dt>
          <dd>{review.assignedTo ?? "Unassigned"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participant-facing reason</dt>
          <dd>{review.participantFacingReason}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason codes</dt>
          <dd>
            <ul className="list-disc pl-5">
              {review.reasonCodes.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence refs</dt>
          <dd className="font-mono text-xs">{review.evidenceRefs.join(", ") || "None"}</dd>
        </div>
      </dl>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {statusMsg ? (
        <p className="text-sm" role="status" aria-live="polite">
          {statusMsg}
        </p>
      ) : null}

      <section aria-labelledby={`${formId}-assign`} className="space-y-3 rounded border p-4">
        <h2 id={`${formId}-assign`} className="text-lg font-semibold">
          {HUMAN_OPS_A11Y.assignFormLabel}
        </h2>
        <label className="flex flex-col gap-1 text-sm" htmlFor={`${formId}-assignee`}>
          <span className="font-medium">Assignee operator id</span>
          <input
            id={`${formId}-assignee`}
            className={formInputClass}
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            autoComplete="off"
          />
        </label>
        <Button
          type="button"
          disabled={busy || !assigneeId}
          onClick={() =>
            void post(`/api/ai/human-ops/reviews/${review.reviewId}/assign`, {
              assigneeId,
            })
          }
        >
          Assign
        </Button>
      </section>

      <section aria-labelledby={`${formId}-info`} className="space-y-3 rounded border p-4">
        <h2 id={`${formId}-info`} className="text-lg font-semibold">
          Request information
        </h2>
        <label className="flex flex-col gap-1 text-sm" htmlFor={`${formId}-info-text`}>
          <span className="font-medium">What to ask the participant</span>
          <textarea
            id={`${formId}-info-text`}
            className={formInputClass}
            rows={3}
            value={infoRequest}
            onChange={(e) => setInfoRequest(e.target.value)}
          />
        </label>
        <Button
          type="button"
          disabled={busy || infoRequest.trim().length < 3}
          onClick={() =>
            void post(
              `/api/ai/human-ops/reviews/${review.reviewId}/request-info`,
              { informationRequested: infoRequest, fromParticipant: true },
            )
          }
        >
          Request info
        </Button>
      </section>

      <section aria-labelledby={`${formId}-resolve`} className="space-y-3 rounded border p-4">
        <h2 id={`${formId}-resolve`} className="text-lg font-semibold">
          {HUMAN_OPS_A11Y.resolveFormLabel}
        </h2>
        <label className="flex flex-col gap-1 text-sm" htmlFor={`${formId}-resolution`}>
          <span className="font-medium">Resolution</span>
          <select
            id={`${formId}-resolution`}
            className={formInputClass}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value="continue_workflow">Continue workflow</option>
            <option value="request_participant_decision">Request participant decision</option>
            <option value="request_information">Request information</option>
            <option value="prepare_action_proposal">Prepare action proposal</option>
            <option value="prepare_recovery_alternative">Prepare recovery alternative</option>
            <option value="route_to_specialist_human">Route to specialist human</option>
            <option value="close_coordination_only">Close coordination only</option>
            <option value="unable_to_assist">Unable to assist</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor={`${formId}-reason`}>
          <span className="font-medium">Resolution reason</span>
          <textarea
            id={`${formId}-reason`}
            className={formInputClass}
            rows={3}
            value={resolutionReason}
            onChange={(e) => setResolutionReason(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor={`${formId}-authority`}>
          <span className="font-medium">Decided under authority</span>
          <input
            id={`${formId}-authority`}
            className={formInputClass}
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
          />
        </label>
        <Button
          type="button"
          disabled={
            busy ||
            resolutionReason.trim().length < 3 ||
            authority.trim().length < 3
          }
          onClick={() =>
            void post(`/api/ai/human-ops/reviews/${review.reviewId}/resolve`, {
              resolution,
              resolutionReason,
              decidedUnderAuthority: authority,
              participantApprovalBypassed: false,
              evidenceRefsUsed: [],
              nextStepsPrepared: [],
              delegateAuthorityId: null,
            })
          }
        >
          Record resolution
        </Button>
      </section>

      <section aria-labelledby={`${formId}-audit`} className="space-y-2">
        <h2 id={`${formId}-audit`} className="text-lg font-semibold">
          Audit trail
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {audit.map((a) => (
            <li key={a.auditId}>
              <span className="font-medium">{a.action}</span> by {a.actorId} at{" "}
              {new Date(a.at).toLocaleString()}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
