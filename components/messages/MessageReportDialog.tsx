"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import type { MessageReportReason } from "@/types/messages";

const REASONS: { value: MessageReportReason; label: string }[] = [
  { value: "abusive_or_harassing", label: "Abusive or harassing" },
  { value: "unsafe_support", label: "Unsafe support" },
  { value: "billing_issue", label: "Billing issue" },
  { value: "privacy_concern", label: "Privacy concern" },
  { value: "discrimination", label: "Discrimination" },
  { value: "worker_no_show", label: "Worker did not show up" },
  { value: "inappropriate_contact", label: "Inappropriate contact" },
  { value: "other", label: "Other" },
];

export function MessageReportDialog({
  threadId,
  messageId,
  onClose,
}: {
  threadId: string;
  messageId?: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<MessageReportReason>("other");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <form
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-lg"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setStatus("");
          const res = await fetch(`/api/messages/threads/${threadId}/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason, details, messageId }),
          });
          setLoading(false);
          if (!res.ok) {
            setStatus("Could not send report. Try again.");
            return;
          }
          setStatus("Report submitted. Our team may review this thread.");
          setTimeout(onClose, 1500);
        }}
      >
        <h2 id="report-dialog-title" className="font-heading text-lg font-bold">
          Report a concern
        </h2>
        <label htmlFor="report-reason" className="text-sm font-medium">
          Reason
        </label>
        <select
          id="report-reason"
          className={formInputClass}
          value={reason}
          onChange={(e) => setReason(e.target.value as MessageReportReason)}
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <label htmlFor="report-details" className="text-sm font-medium">
          Details (optional)
        </label>
        <textarea
          id="report-details"
          className={formInputClass}
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        {status ? (
          <p role="status" className="text-sm">
            {status}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="default" onClick={onClose} className="min-h-11 flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="default" size="default" loading={loading} className="min-h-11 flex-1">
            Submit report
          </Button>
        </div>
      </form>
    </div>
  );
}
