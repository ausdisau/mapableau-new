"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewCreative = {
  id: string;
  headline: string;
  body: string;
  destinationUrl: string;
  claimFlags: string[];
  status: string;
  campaign: {
    id: string;
    name: string;
    advertiser: { id: string; name: string };
  };
};

export function AdminReviewActions({ creative }: { creative: ReviewCreative }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject" | "activate") {
    setBusy(true);
    setError(null);
    try {
      const body =
        action === "reject"
          ? { action, creativeId: creative.id, notes: notes || "Rejected" }
          : action === "approve"
            ? { action, creativeId: creative.id, notes: notes || undefined }
            : { action, creativeId: creative.id };

      const res = await fetch("/api/admin/ads/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <label className="block text-sm">
        Review notes
        <textarea
          className="mt-1 w-full min-h-16 rounded border border-input bg-background px-2 py-1 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
        />
      </label>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {creative.status === "PENDING_REVIEW" ? (
          <>
            <button
              type="button"
              className="min-h-11 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              disabled={busy}
              onClick={() => void run("approve")}
            >
              Approve
            </button>
            <button
              type="button"
              className="min-h-11 rounded border border-destructive px-3 text-sm font-semibold text-destructive disabled:opacity-50"
              disabled={busy}
              onClick={() => void run("reject")}
            >
              Reject
            </button>
          </>
        ) : null}
        {creative.status === "APPROVED" ? (
          <button
            type="button"
            className="min-h-11 rounded bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void run("activate")}
          >
            Activate
          </button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Activate does not turn on public serving — MAPABLE_ADS_* flags must also
        be enabled by ops.
      </p>
    </div>
  );
}
