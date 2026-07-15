"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  DISPLAY_DIMENSIONS,
  FEATURE_TAG_CATALOG,
  OPTIONAL_ACCESS_CONTEXT_OPTIONS,
  OVERALL_EXPERIENCE_OPTIONS,
  RATING_VALUE_OPTIONS,
} from "@/lib/access-reviews/review-config";
import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";
import { AddAccessReviewFormLegacy } from "@/components/access-reviews/AddAccessReviewFormLegacy";

const STEPS = [
  "Visit context",
  "Overall experience",
  "Dimension ratings",
  "Feature tags",
  "Comment",
  "Evidence",
  "Access context",
  "Review and submit",
] as const;

export function AddAccessReviewForm({ placeId }: { placeId: string }) {
  if (!accessibilityReviewsV1Enabled) {
    return <AddAccessReviewFormLegacy placeId={placeId} />;
  }
  return <AddAccessibilityReviewStepper placeId={placeId} />;
}

function AddAccessibilityReviewStepper({ placeId }: { placeId: string }) {
  const router = useRouter();
  const formId = useId();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [visitDate, setVisitDate] = useState("");
  const [visitTimePrecision, setVisitTimePrecision] = useState<
    "none" | "approximate" | "exact"
  >("none");
  const [observationSource, setObservationSource] = useState<
    "in_person" | "venue_inspection" | "other"
  >("in_person");
  const [temporaryIssue, setTemporaryIssue] = useState(false);
  const [overallExperience, setOverallExperience] = useState("prefer_not");
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [barrierTags, setBarrierTags] = useState<string[]>([]);
  const [reviewBody, setReviewBody] = useState("");
  const [evidenceAltText, setEvidenceAltText] = useState("");
  const [privacyAck, setPrivacyAck] = useState(false);
  const [accessContext, setAccessContext] = useState<string[]>([]);
  const [displayNameMode, setDisplayNameMode] = useState<
    "anonymous_public" | "first_name" | "named"
  >("anonymous_public");

  function toggle(list: string[], key: string, setter: (v: string[]) => void) {
    setter(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  }

  async function submit() {
    setError(null);
    if (!privacyAck) {
      setError("Confirm the privacy reminder before submitting.");
      return;
    }
    if (reviewBody.trim().length < 10) {
      setError("Add a comment of at least 10 characters before submitting.");
      setStep(4);
      return;
    }

    setSubmitting(true);
    const ratingPayload = Object.entries(ratings).map(([category, value]) => ({
      category,
      value,
    }));
    if (ratingPayload.length === 0) {
      setError("Rate at least one dimension you observed, or mark not observed.");
      setStep(2);
      setSubmitting(false);
      return;
    }

    const featureTags = [
      ...positiveTags.map((tagKey) => ({
        tagKey,
        sentiment: "positive" as const,
      })),
      ...barrierTags.map((tagKey) => ({
        tagKey,
        sentiment: "barrier" as const,
      })),
    ];

    const res = await fetch(`/api/access/places/${placeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayNameMode,
        visitDate: visitDate
          ? new Date(visitDate).toISOString()
          : undefined,
        visitTimePrecision,
        observationSource,
        overallExperience,
        temporaryIssue,
        reviewBody,
        accessContextJson: accessContext,
        publish: true,
        ratings: ratingPayload,
        featureTags,
        mobilityContext: evidenceAltText || undefined,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not submit review");
      return;
    }
    router.push(`/access/places/${placeId}`);
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Review steps">
        <ol className="flex flex-wrap gap-2 text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={
                i === step
                  ? "rounded-lg bg-primary px-2 py-1 text-primary-foreground"
                  : "rounded-lg border border-border px-2 py-1"
              }
              aria-current={i === step ? "step" : undefined}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </nav>

      <p className="text-sm text-muted-foreground">
        Accessibility review — community information. Not a legal compliance
        determination. Do not name individual staff, disclose another person’s
        disability, include health records, or include personal contact details.
      </p>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div
        role="group"
        aria-labelledby={`${formId}-step-title`}
        className="space-y-4"
      >
        <h2 id={`${formId}-step-title`} className="text-xl font-semibold">
          {STEPS[step]}
        </h2>

        {step === 0 ? (
          <fieldset className="space-y-3">
            <legend className="sr-only">Visit context</legend>
            <label className="block">
              <span className="font-medium">Date visited or observed</span>
              <input
                type="date"
                className="mt-1 block min-h-11 w-full rounded-lg border border-border px-3"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </label>
            <fieldset>
              <legend className="font-medium">Time precision</legend>
              {(
                [
                  ["none", "Do not publish a time"],
                  ["approximate", "Approximate time only"],
                  ["exact", "Exact time (only if you choose to share)"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="mt-1 flex min-h-11 items-center gap-2">
                  <input
                    type="radio"
                    name="visitTimePrecision"
                    value={value}
                    checked={visitTimePrecision === value}
                    onChange={() => setVisitTimePrecision(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend className="font-medium">Observation source</legend>
              {(
                [
                  ["in_person", "Visited in person"],
                  ["venue_inspection", "Current venue inspection"],
                  ["other", "Other"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="mt-1 flex min-h-11 items-center gap-2">
                  <input
                    type="radio"
                    name="observationSource"
                    value={value}
                    checked={observationSource === value}
                    onChange={() => setObservationSource(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={temporaryIssue}
                onChange={(e) => setTemporaryIssue(e.target.checked)}
              />
              The issue appears temporary
            </label>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset>
            <legend className="font-medium">
              Could you use this place as independently and comfortably as you
              expected?
            </legend>
            {OVERALL_EXPERIENCE_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="mt-1 flex min-h-11 items-center gap-2"
              >
                <input
                  type="radio"
                  name="overallExperience"
                  value={opt.key}
                  checked={overallExperience === opt.key}
                  onChange={() => setOverallExperience(opt.key)}
                />
                {opt.label}
              </label>
            ))}
          </fieldset>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rate only the areas you encountered. Selecting a rating does not
              advance automatically.
            </p>
            {DISPLAY_DIMENSIONS.map((dim) => {
              const category = dim.categories[0];
              return (
                <fieldset
                  key={dim.key}
                  className="rounded-lg border border-border p-3"
                >
                  <legend className="font-medium">{dim.label}</legend>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {RATING_VALUE_OPTIONS.map((opt) => (
                      <label
                        key={opt.key}
                        className="flex min-h-11 items-center gap-1 text-sm"
                      >
                        <input
                          type="radio"
                          name={`rating-${category}`}
                          value={opt.key}
                          checked={ratings[category] === opt.key}
                          onChange={() =>
                            setRatings((prev) => ({
                              ...prev,
                              [category]: opt.key,
                            }))
                          }
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="font-medium">Positive tags</legend>
              {FEATURE_TAG_CATALOG.positive.map((tag) => (
                <label
                  key={tag.key}
                  className="mt-1 flex min-h-11 items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={positiveTags.includes(tag.key)}
                    onChange={() =>
                      toggle(positiveTags, tag.key, setPositiveTags)
                    }
                  />
                  {tag.label}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend className="font-medium">Barrier tags</legend>
              {FEATURE_TAG_CATALOG.barrier.map((tag) => (
                <label
                  key={tag.key}
                  className="mt-1 flex min-h-11 items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={barrierTags.includes(tag.key)}
                    onChange={() =>
                      toggle(barrierTags, tag.key, setBarrierTags)
                    }
                  />
                  {tag.label}
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <label className="block">
              <span className="font-medium">Comment</span>
              <textarea
                className="mt-1 block min-h-[8rem] w-full rounded-lg border border-border p-3"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                maxLength={8000}
                aria-describedby={`${formId}-comment-help`}
              />
            </label>
            <p id={`${formId}-comment-help`} className="text-sm text-muted-foreground">
              Describe what you encountered, what helped, what created a
              barrier, whether staff assistance was required, and whether the
              issue appeared temporary. {reviewBody.length}/8000 characters.
            </p>
            <fieldset>
              <legend className="font-medium">Public display name</legend>
              {(
                [
                  ["anonymous_public", "Anonymous to public"],
                  ["first_name", "First name only"],
                  ["named", "Full name"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="mt-1 flex min-h-11 items-center gap-2">
                  <input
                    type="radio"
                    name="displayNameMode"
                    value={value}
                    checked={displayNameMode === value}
                    onChange={() => setDisplayNameMode(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3">
            <p className="text-sm">
              Privacy reminder: do not include identifiable people without
              permission. Prefer alt text for images. Unnecessary metadata
              should be removed where the media service supports it.
            </p>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={privacyAck}
                onChange={(e) => setPrivacyAck(e.target.checked)}
              />
              I confirm identifiable people are not included without permission
            </label>
            <label className="block">
              <span className="font-medium">
                Image alt text or evidence description (optional)
              </span>
              <input
                className="mt-1 block min-h-11 w-full rounded-lg border border-border px-3"
                value={evidenceAltText}
                onChange={(e) => setEvidenceAltText(e.target.value)}
              />
            </label>
            <p className="text-sm text-muted-foreground">
              Photo and document upload uses the existing media path after
              submit where supported.
            </p>
          </div>
        ) : null}

        {step === 6 ? (
          <fieldset>
            <legend className="font-medium">
              Optional access context (private by default — not published)
            </legend>
            <p className="mt-1 text-sm text-muted-foreground">
              Do not enter a diagnosis. This is optional functional context only.
            </p>
            {OPTIONAL_ACCESS_CONTEXT_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="mt-1 flex min-h-11 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={accessContext.includes(opt.key)}
                  onChange={() =>
                    toggle(accessContext, opt.key, setAccessContext)
                  }
                />
                {opt.label}
              </label>
            ))}
          </fieldset>
        ) : null}

        {step === 7 ? (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="font-medium">Summary before submission</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Visit date: {visitDate || "Not set"}</li>
              <li>
                Overall experience:{" "}
                {OVERALL_EXPERIENCE_OPTIONS.find(
                  (o) => o.key === overallExperience
                )?.label}
              </li>
              <li>Rated dimensions: {Object.keys(ratings).length}</li>
              <li>
                Tags: {positiveTags.length} positive, {barrierTags.length}{" "}
                barrier
              </li>
              <li>Comment length: {reviewBody.length} characters</li>
              <li>
                Private access context items: {accessContext.length} (not
                published)
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Submission requires your explicit action. Consent is never inferred
              from silence.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-11 rounded-lg border border-border px-4"
          disabled={step === 0 || submitting}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Submitting…" : "Submit accessibility review"}
          </button>
        )}
      </div>
    </div>
  );
}
