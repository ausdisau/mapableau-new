"use client";

import { useMemo, useState } from "react";

import { ConsentSummary } from "@/components/governance/ConsentSummary";
import { GovernanceStatusCard } from "@/components/governance/GovernanceStatusCard";
import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { trackProductEvent } from "@/lib/analytics/product-analytics";
import type { GovernanceStatus } from "@/lib/governance/types";

export function InterviewSupportPlanDemo() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [transportNeed, setTransportNeed] = useState(false);
  const [communicationSupport, setCommunicationSupport] = useState(false);
  const [supportWorker, setSupportWorker] = useState(false);
  const [workplaceNotes, setWorkplaceNotes] = useState("");
  const [shareWithEmployer, setShareWithEmployer] = useState(false);
  const [shareAdjustments, setShareAdjustments] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<GovernanceStatus>("ready_to_review");

  const consentItems = useMemo(
    () => [
      {
        id: "employer",
        label: "Share selected support plan with employer",
        granted: shareWithEmployer,
        sensitive: true,
      },
      {
        id: "adjustments",
        label: "Share adjustment preferences with support team",
        granted: shareAdjustments,
        sensitive: true,
      },
    ],
    [shareAdjustments, shareWithEmployer],
  );

  function onSubmit() {
    setStatus(
      shareWithEmployer && !shareAdjustments
        ? "participant_confirmation_required"
        : "ready_to_review",
    );
    setSubmitted(true);
    trackProductEvent("jobs_support_plan_demo_completed", { has_transport: transportNeed });
  }

  return (
    <div className="space-y-6">
      <Alert variant="info" title="Demo only">
        This support plan is not saved or shared with employers. Consent toggles default to off.
      </Alert>

      {!submitted ? (
        <>
          <AccessibleFormField id="interview-date" label="Interview date" required>
            <input
              id="interview-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
            />
          </AccessibleFormField>
          <AccessibleFormField id="interview-time" label="Interview time" required>
            <input
              id="interview-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
            />
          </AccessibleFormField>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Supports for this interview</legend>
            <label className="flex min-h-[var(--touch-target-min)] items-center gap-3">
              <input type="checkbox" checked={transportNeed} onChange={(e) => setTransportNeed(e.target.checked)} />
              Accessible transport to the interview
            </label>
            <label className="flex min-h-[var(--touch-target-min)] items-center gap-3">
              <input
                type="checkbox"
                checked={communicationSupport}
                onChange={(e) => setCommunicationSupport(e.target.checked)}
              />
              Communication support (for example Auslan interpreter)
            </label>
            <label className="flex min-h-[var(--touch-target-min)] items-center gap-3">
              <input type="checkbox" checked={supportWorker} onChange={(e) => setSupportWorker(e.target.checked)} />
              Support worker or job coach attends
            </label>
          </fieldset>
          <AccessibleFormField id="workplace-notes" label="Workplace access notes (optional)">
            <textarea
              id="workplace-notes"
              value={workplaceNotes}
              onChange={(e) => setWorkplaceNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input px-3 py-2"
            />
          </AccessibleFormField>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Consent (default off)</legend>
            <label className="flex min-h-[var(--touch-target-min)] items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={shareWithEmployer}
                onChange={(e) => setShareWithEmployer(e.target.checked)}
                className="mt-1 h-5 w-5"
              />
              I consent to share my interview support plan with the employer
            </label>
            <label className="flex min-h-[var(--touch-target-min)] items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={shareAdjustments}
                onChange={(e) => setShareAdjustments(e.target.checked)}
                className="mt-1 h-5 w-5"
              />
              I consent to share adjustment preferences with my support team
            </label>
          </fieldset>
          <Button variant="default" size="default" onClick={onSubmit} disabled={!date || !time}>
            Review plan
          </Button>
        </>
      ) : (
        <>
          <GovernanceStatusCard status={status} />
          <ConsentSummary items={consentItems} />
          <div className="rounded-xl border border-border p-4 text-sm space-y-2">
            <p>
              <strong>Interview:</strong> {date} {time}
            </p>
            <p>
              <strong>Supports:</strong>{" "}
              {[
                transportNeed ? "transport" : null,
                communicationSupport ? "communication" : null,
                supportWorker ? "support worker" : null,
              ]
                .filter(Boolean)
                .join(", ") || "None selected"}
            </p>
            {workplaceNotes ? <p><strong>Workplace notes:</strong> {workplaceNotes}</p> : null}
            <p className="text-muted-foreground">
              AI matching notes: placeholder only — no automated matching runs in this demo.
            </p>
          </div>
          <Button variant="outline" size="default" onClick={() => setSubmitted(false)}>
            Edit plan
          </Button>
        </>
      )}
    </div>
  );
}
