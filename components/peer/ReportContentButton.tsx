"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReportContentButton({
  contentType,
  contentId,
}: {
  contentType: string;
  contentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("boundary_issue");
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    setStatus("submitting");
    const res = await fetch("/api/peer/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId, reason }),
    });
    setStatus(res.ok ? "done" : "error");
    if (res.ok) setOpen(false);
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="default"
        className="min-h-11"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Report content
      </Button>
      {open ? (
        <form
          className="mt-2 space-y-2 rounded-lg border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label htmlFor={`report-reason-${contentId}`} className="text-sm font-medium">
            Reason
          </label>
          <select
            id={`report-reason-${contentId}`}
            className="min-h-11 w-full rounded-md border px-3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="abuse_or_harassment">Abuse or harassment</option>
            <option value="privacy_violation">Privacy violation</option>
            <option value="unsafe_advice">Unsafe advice</option>
            <option value="self_harm_or_crisis">Self-harm or crisis</option>
            <option value="boundary_issue">Boundary issue</option>
            <option value="other">Other</option>
          </select>
          <Button type="submit" variant="default" size="default" className="min-h-11" disabled={status === "submitting"}>
            Submit report
          </Button>
          {status === "done" ? (
            <p className="text-sm text-muted-foreground" role="status">
              Thank you. A moderator will review this.
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
