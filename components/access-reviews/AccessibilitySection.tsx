"use client";

import { useEffect, useId, useState } from "react";

import { COMMUNITY_CONFIDENCE_LABELS } from "@/lib/access-reviews/review-config";
import { DISPLAY_DIMENSIONS } from "@/lib/access-reviews/review-config";

type SummaryPayload = {
  dimensions: {
    category: string;
    adjustedRating: number | null;
    rawResponseCount: number;
    uniqueContributorCount: number;
    recentContributorCount: number;
    lastConfirmedAt: string | null;
    evidenceCount: number;
    conflictCount: number;
    confidenceState: string;
    confidenceLabel: string;
    reasonCodes: string[];
  }[];
  commonPositiveFeatures: { key: string; count: number }[];
  commonlyReportedBarriers: { key: string; count: number }[];
  alerts: {
    id: string;
    featureKey: string;
    title: string;
    body: string | null;
    observationDate: string;
    expectedExpiry: string | null;
    sourceType: string;
    status: string;
  }[];
  professionalAccreditation: {
    tier: string | null;
    assessmentDate: string | null;
    expiryOrReviewDate: string | null;
    assessmentId: string;
    disclaimer: string;
  } | null;
};

type CommentItem = {
  id: string;
  body: string;
  commentType: string;
  featureKey: string;
  authorRole: string | null;
  publicAuthorName: string;
  replyCount: number;
  createdAt: string;
  editedAt: string | null;
  status: string;
  replies: {
    id: string;
    body: string;
    commentType: string;
    authorRole: string | null;
    publicAuthorName: string;
    createdAt: string;
    editedAt: string | null;
  }[];
};

export function AccessibilitySection({ placeId }: { placeId: string }) {
  const headingId = useId();
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [sRes, cRes] = await Promise.all([
          fetch(`/api/access/places/${placeId}/accessibility-summary`),
          fetch(`/api/access/places/${placeId}/comments`),
        ]);
        if (!sRes.ok) {
          throw new Error("Could not load accessibility summary");
        }
        const sJson = await sRes.json();
        const cJson = cRes.ok ? await cRes.json() : { items: [] };
        if (!cancelled) {
          setSummary(sJson.summary);
          setComments(cJson.items ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  async function react(
    targetType: "review" | "comment",
    targetId: string,
    reactionType: "helpful" | "confirm" | "changed"
  ) {
    await fetch("/api/access/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        reactionType,
        active: true,
      }),
    });
  }

  if (loading) {
    return (
      <section aria-labelledby={headingId} className="space-y-3">
        <h2 id={headingId} className="text-lg font-semibold">
          Accessibility
        </h2>
        <p className="text-sm text-muted-foreground" role="status">
          Loading accessibility information…
        </p>
      </section>
    );
  }

  if (error || !summary) {
    return (
      <section aria-labelledby={headingId} className="space-y-3">
        <h2 id={headingId} className="text-lg font-semibold">
          Accessibility
        </h2>
        <p className="text-sm text-destructive" role="alert">
          {error ?? "Accessibility information is unavailable."}
        </p>
      </section>
    );
  }

  const grouped = DISPLAY_DIMENSIONS.map((dim) => {
    const parts = summary.dimensions.filter((d) =>
      (dim.categories as readonly string[]).includes(d.category)
    );
    if (!parts.length) {
      return {
        key: dim.key,
        label: dim.label,
        adjustedRating: null as number | null,
        uniqueContributorCount: 0,
        recentContributorCount: 0,
        confidenceLabel: COMMUNITY_CONFIDENCE_LABELS.limited,
        lastConfirmedAt: null as string | null,
        reasonCodes: ["insufficient_data"],
      };
    }
    const withRating = parts.filter((p) => p.adjustedRating != null);
    const adjustedRating =
      withRating.length === 0
        ? null
        : withRating.reduce((a, p) => a + (p.adjustedRating ?? 0), 0) /
          withRating.length;
    const confidenceLabel =
      parts.find((p) => p.confidenceState === "recently_verified")
        ?.confidenceLabel ??
      parts.find((p) => p.confidenceState === "well_supported")
        ?.confidenceLabel ??
      parts[0]?.confidenceLabel ??
      COMMUNITY_CONFIDENCE_LABELS.limited;
    return {
      key: dim.key,
      label: dim.label,
      adjustedRating:
        adjustedRating == null
          ? null
          : Math.round(adjustedRating * 100) / 100,
      uniqueContributorCount: Math.max(
        ...parts.map((p) => p.uniqueContributorCount)
      ),
      recentContributorCount: Math.max(
        ...parts.map((p) => p.recentContributorCount)
      ),
      confidenceLabel,
      lastConfirmedAt: parts
        .map((p) => p.lastConfirmedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
      reasonCodes: parts.flatMap((p) => p.reasonCodes),
    };
  });

  return (
    <section aria-labelledby={headingId} className="space-y-6">
      <div>
        <h2 id={headingId} className="text-lg font-semibold">
          Accessibility
        </h2>
        <p className="text-sm text-muted-foreground">
          Community access information by dimension. This is not a legal
          compliance determination. Confidence is shown separately from the
          community rating.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Accessibility summary</h3>
        <ul className="space-y-3">
          {grouped.map((dim) => (
            <li
              key={dim.key}
              className="rounded-lg border border-border p-3"
            >
              <p className="font-medium">{dim.label}</p>
              {dim.adjustedRating == null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Limited information — not enough community ratings yet.
                </p>
              ) : (
                <p className="mt-1 text-sm">
                  Community rating: {dim.adjustedRating.toFixed(1)} of 5
                  (adjusted). Recent contributors:{" "}
                  {dim.recentContributorCount}. Confidence:{" "}
                  <span>{dim.confidenceLabel}</span>
                  {dim.lastConfirmedAt
                    ? `. Last confirmed ${new Date(
                        dim.lastConfirmedAt
                      ).toLocaleDateString("en-AU")}`
                    : ""}
                  .
                </p>
              )}
            </li>
          ))}
        </ul>

        {(summary.commonPositiveFeatures.length > 0 ||
          summary.commonlyReportedBarriers.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium">Common positive features</h4>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {summary.commonPositiveFeatures.map((f) => (
                  <li key={f.key}>
                    {f.key.replace(/_/g, " ")} ({f.count})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium">
                Commonly reported barriers
              </h4>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {summary.commonlyReportedBarriers.map((f) => (
                  <li key={f.key}>
                    {f.key.replace(/_/g, " ")} ({f.count})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {summary.professionalAccreditation ? (
        <div
          className="rounded-lg border border-border bg-muted/30 p-4"
          aria-labelledby="professional-accreditation-heading"
        >
          <h3
            id="professional-accreditation-heading"
            className="font-medium"
          >
            Professional accreditation
          </h3>
          <p className="mt-1 text-sm">
            Assessment tier:{" "}
            {summary.professionalAccreditation.tier ?? "Not accredited"}
            {summary.professionalAccreditation.assessmentDate
              ? `. Assessed ${new Date(
                  summary.professionalAccreditation.assessmentDate
                ).toLocaleDateString("en-AU")}`
              : ""}
            {summary.professionalAccreditation.expiryOrReviewDate
              ? `. Review by ${new Date(
                  summary.professionalAccreditation.expiryOrReviewDate
                ).toLocaleDateString("en-AU")}`
              : ""}
            .
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.professionalAccreditation.disclaimer}
          </p>
          <a
            className="mt-2 inline-flex min-h-11 items-center underline"
            href={`/access/places/${placeId}/accreditation`}
          >
            View assessment details
          </a>
        </div>
      ) : null}

      <div>
        <h3 className="font-medium">Current alerts</h3>
        {summary.alerts.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            No active temporary alerts.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {summary.alerts.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">
                  Affected feature: {a.featureKey.replace(/_/g, " ")}. Observed{" "}
                  {new Date(a.observationDate).toLocaleDateString("en-AU")}.
                  Source: {a.sourceType}.
                  {a.expectedExpiry
                    ? ` Expected until ${new Date(
                        a.expectedExpiry
                      ).toLocaleDateString("en-AU")}.`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-border px-3 text-sm"
                    onClick={() => void react("comment", a.id, "confirm")}
                  >
                    Confirm this information
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-border px-3 text-sm"
                    onClick={() => void react("comment", a.id, "changed")}
                  >
                    Report outdated
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-medium">Comments</h3>
        {comments.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            No published comments yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">
                  {c.publicAuthorName}
                  {c.authorRole ? ` (${c.authorRole})` : ""} —{" "}
                  {c.commentType.replace(/_/g, " ")} —{" "}
                  {c.featureKey.replace(/_/g, " ")}
                  {c.editedAt ? " (edited)" : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("en-AU")} ·{" "}
                  {c.replyCount} replies · status {c.status}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-border px-3 text-sm"
                    onClick={() => void react("comment", c.id, "helpful")}
                  >
                    Helpful
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-border px-3 text-sm"
                    onClick={() => void react("comment", c.id, "confirm")}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-border px-3 text-sm"
                    onClick={() => void react("comment", c.id, "changed")}
                  >
                    Information changed
                  </button>
                  <a
                    className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm"
                    href={`#comment-${c.id}`}
                    id={`comment-${c.id}`}
                  >
                    Copy link
                  </a>
                </div>
                {c.replies.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-l border-border pl-3">
                    {c.replies.map((r) => (
                      <li key={r.id}>
                        <p className="text-sm font-medium">
                          {r.publicAuthorName}
                          {r.authorRole ? ` (${r.authorRole})` : ""}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
