"use client";

import { useState } from "react";

export function ReportPlaceIssueButton({ placeId }: { placeId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/access/places/${placeId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: fd.get("reason"),
        details: fd.get("details"),
      }),
    });
    setDone(true);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="min-h-11 rounded-lg border border-border px-4 text-sm"
        onClick={() => setOpen(true)}
      >
        Report inaccurate information
      </button>
      {done ? (
        <p className="text-sm text-muted-foreground" role="status">
          Thank you — your report was received.
        </p>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
        >
          <form
            className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg"
            onSubmit={submit}
          >
            <h2 id="report-title" className="text-lg font-semibold">
              Report issue
            </h2>
            <label className="mt-3 block">
              <span className="text-sm">Reason</span>
              <select name="reason" required className="mt-1 min-h-11 w-full rounded-lg border px-2">
                <option value="inaccurate_access_information">Inaccurate access information</option>
                <option value="closed_or_moved_place">Closed or moved</option>
                <option value="duplicate_place">Duplicate</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="mt-3 block">
              <span className="text-sm">Details</span>
              <textarea name="details" rows={3} className="mt-1 w-full rounded-lg border px-2" />
            </label>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="min-h-11 flex-1 rounded-lg bg-primary text-primary-foreground">
                Submit
              </button>
              <button
                type="button"
                className="min-h-11 rounded-lg border px-4"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
