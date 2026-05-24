"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { formatStatusLabel } from "@/lib/disputes/labels";
import { Button } from "@/components/ui/button";

export function ComplaintStatusPanel({
  complaintId,
  currentStatus,
  isAdmin,
}: {
  complaintId: string;
  currentStatus: string;
  isAdmin: boolean;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <p className="text-sm">
        Status: <strong>{formatStatusLabel(currentStatus)}</strong>
      </p>
    );
  }

  return (
    <section aria-labelledby="complaint-admin-heading" className="space-y-3">
      <h2 id="complaint-admin-heading" className="font-heading text-lg font-semibold">
        Admin update
      </h2>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const fd = new FormData(e.currentTarget);
          const res = await fetch(`/api/complaints/${complaintId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: fd.get("status"),
              resolutionSummary: fd.get("resolutionSummary") || undefined,
            }),
          });
          setLoading(false);
          setMessage(res.ok ? "Status updated." : "Update failed.");
          if (res.ok) setStatus(String(fd.get("status")));
        }}
      >
        <label htmlFor="complaint-status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="complaint-status"
          name="status"
          className={formInputClass}
          defaultValue={status}
        >
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="escalated_to_incident">Escalated to incident</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <label htmlFor="complaint-resolution" className="text-sm font-medium">
          Resolution summary (optional)
        </label>
        <textarea
          id="complaint-resolution"
          name="resolutionSummary"
          className={formInputClass}
          rows={3}
        />
        {message ? (
          <p role="status" aria-live="polite" className="text-sm">
            {message}
          </p>
        ) : null}
        <Button type="submit" variant="default" size="default" loading={loading}>
          Save status
        </Button>
      </form>
    </section>
  );
}
