"use client";

import { useState } from "react";

import { MatchReasonList } from "@/components/support-workers/MatchReasonList";
import { WorkerSafetyBadges } from "@/components/support-workers/WorkerSafetyBadges";
import type { WorkerMatch } from "@/types/support-workers";

export function SupportWorkerMatchCard({
  match,
  matchRunId,
  onAction,
}: {
  match: WorkerMatch;
  matchRunId?: string | null;
  onAction?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendEvent(
    eventType: "save_preferred" | "hide" | "reject" | "select"
  ) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/support-workers/match-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          workerProfileId: match.worker.id,
          matchRunId: matchRunId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      const labels: Record<string, string> = {
        save_preferred: "Worker saved to your preferences.",
        hide: "Worker hidden from future results.",
        reject: "Worker removed from this search.",
        select: "Selection recorded. Your provider will follow up.",
      };
      setMessage(labels[eventType]);
      onAction?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const confidenceLabel =
    match.confidence === "high"
      ? "Good fit"
      : match.confidence === "medium"
        ? "Moderate fit"
        : "Lower fit — review carefully";

  return (
    <article
      className="rounded-lg border p-4 shadow-sm"
      aria-labelledby={`worker-${match.worker.id}-title`}
    >
      <header className="space-y-2">
        <h2 id={`worker-${match.worker.id}-title`} className="text-lg font-semibold">
          {match.worker.displayName}
        </h2>
        <p className="text-sm text-muted-foreground">{match.worker.organisationName}</p>
        <p className="text-sm">
          <span className="font-medium">{confidenceLabel}</span>
          {" — "}
          <span>{match.score} out of 100 match score</span>
        </p>
        <WorkerSafetyBadges badges={match.worker.badges} />
      </header>

      <div className="mt-4">
        <MatchReasonList reasons={match.reasons} warnings={match.warnings} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => void sendEvent("save_preferred")}
        >
          Save preferred worker
        </button>
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => void sendEvent("hide")}
        >
          Hide worker
        </button>
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => void sendEvent("reject")}
        >
          Not a fit
        </button>
        <button
          type="button"
          className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
          disabled={busy}
          onClick={() => void sendEvent("select")}
        >
          Interested in this worker
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </article>
  );
}
