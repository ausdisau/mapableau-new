"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { AccessMarkerCommentForm } from "@/components/access/AccessMarkerCommentForm";
import { AccessMarkerRatingForm } from "@/components/access/AccessMarkerRatingForm";
import { buildPlanAccessibleTransportUrl } from "@/lib/access-markers/plan-accessible-transport";
import type { AccessMarkerSummary } from "@/lib/access-markers/types";
import { DOMAIN_FIELD_LABELS } from "@/lib/access-markers/types";

type AccessMarkerPopupProps = {
  placeId: string;
  onClose: () => void;
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums" aria-label={`${pct} percent`}>
          {pct}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-[#005B7F]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AccessMarkerPopup({ placeId, onClose }: AccessMarkerPopupProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [summary, setSummary] = useState<AccessMarkerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/access/places/${placeId}/marker-summary`);
      if (!res.ok) {
        setError("Could not load place access summary.");
        setSummary(null);
        return;
      }
      const data = await res.json();
      setSummary(data.summary as AccessMarkerSummary);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [placeId]);

  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !ratingOpen && !commentOpen) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, ratingOpen, commentOpen]);

  async function verify(action: "confirm_accurate" | "mark_outdated" | "dispute") {
    setActionError(null);
    const res = await fetch(`/api/access/places/${placeId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setActionError(j.error ?? "Sign in to verify or dispute information.");
      return;
    }
    await load();
  }

  const btnClass =
    "min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0C1833] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F]";

  return (
    <>
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg outline-none"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading access details…</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {summary ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-lg font-bold text-[#0C1833]">
                  {summary.name}
                </h2>
                <p className="text-sm capitalize text-slate-600">
                  {summary.category.replace(/_/g, " ")}
                  {summary.addressOrSuburb
                    ? ` · ${summary.addressOrSuburb}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-slate-200"
                aria-label="Close place details"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Overall access
                </p>
                <p className="text-2xl font-black tabular-nums text-[#005B7F]">
                  {Math.round(summary.overallScore)}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Confidence
                </p>
                <p className="text-2xl font-black tabular-nums text-[#0C1833]">
                  {Math.round(summary.confidenceScore)}%
                </p>
              </div>
              <p className="col-span-2 text-sm text-slate-600">
                {summary.ratingCount}{" "}
                {summary.ratingCount === 1 ? "rating" : "ratings"}
                {summary.lastCheckedAt
                  ? ` · Last checked ${new Date(summary.lastCheckedAt).toLocaleDateString("en-AU")}`
                  : ""}
              </p>
            </div>

            <div className="space-y-3" aria-label="Domain access scores">
              <ScoreBar label={DOMAIN_FIELD_LABELS.mobility} value={summary.domainScores.mobility} />
              <ScoreBar label={DOMAIN_FIELD_LABELS.toilet} value={summary.domainScores.toilet} />
              <ScoreBar
                label={DOMAIN_FIELD_LABELS.parkingDropoff}
                value={summary.domainScores.parkingDropoff}
              />
              <ScoreBar label={DOMAIN_FIELD_LABELS.sensory} value={summary.domainScores.sensory} />
              <ScoreBar
                label={DOMAIN_FIELD_LABELS.communication}
                value={summary.domainScores.communication}
              />
              <ScoreBar
                label={DOMAIN_FIELD_LABELS.staffService}
                value={summary.domainScores.staffService}
              />
            </div>

            <section aria-labelledby={`${titleId}-comments`}>
              <h3 id={`${titleId}-comments`} className="text-sm font-semibold">
                Latest comments
              </h3>
              {summary.latestComments.length === 0 ? (
                <p className="mt-1 text-sm text-slate-600">No comments yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {summary.latestComments.map((c) => (
                    <li key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="text-xs uppercase text-slate-500">
                        {c.commentType.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 text-[#0C1833]">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {summary.activeAlerts.length > 0 ? (
              <section aria-labelledby={`${titleId}-alerts`}>
                <h3 id={`${titleId}-alerts`} className="text-sm font-semibold">
                  Active access alerts
                </h3>
                <ul className="mt-2 space-y-2">
                  {summary.activeAlerts.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
                    >
                      {a.body}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {actionError ? (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2" role="group" aria-label="Place actions">
              <button type="button" className={btnClass} onClick={() => setRatingOpen(true)}>
                Rate
              </button>
              <button type="button" className={btnClass} onClick={() => setCommentOpen(true)}>
                Comment
              </button>
              <button
                type="button"
                className={btnClass}
                onClick={() => void verify("confirm_accurate")}
              >
                Verify
              </button>
              <button
                type="button"
                className={btnClass}
                onClick={() => void verify("dispute")}
              >
                Dispute
              </button>
              <Link
                href={buildPlanAccessibleTransportUrl(summary)}
                className={`inline-flex items-center ${btnClass}`}
              >
                Plan Accessible Transport
              </Link>
              <Link
                href={`/access/places/${summary.placeId}`}
                className={`inline-flex items-center ${btnClass}`}
              >
                View Full Details
              </Link>
              <button
                type="button"
                className={btnClass}
                onClick={() => void verify("mark_outdated")}
              >
                Mark outdated
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Community accessibility information is indicative only. It is not
              legal advice or a DDA compliance assessment.
            </p>
          </div>
        ) : null}
      </aside>

      {summary ? (
        <>
          <AccessMarkerRatingForm
            placeId={placeId}
            placeName={summary.name}
            open={ratingOpen}
            onClose={() => setRatingOpen(false)}
            onSaved={() => void load()}
          />
          <AccessMarkerCommentForm
            placeId={placeId}
            placeName={summary.name}
            open={commentOpen}
            onClose={() => setCommentOpen(false)}
            onSaved={() => void load()}
          />
        </>
      ) : null}
    </>
  );
}
