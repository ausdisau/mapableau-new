"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  JourneyOptimisationPreference,
  RouteRecommendation,
  TrafficAwareRouteCandidate,
} from "@/types/maji";
import { JOURNEY_OPTIMISATION_PREFERENCES, MAJI_ADVISORY_COPY } from "@/types/maji";

const PREFERENCE_LABELS: Record<JourneyOptimisationPreference, string> = {
  lowest_cost: "Lowest operating cost",
  earliest_arrival: "Earliest arrival",
  balanced: "Balanced",
  minimise_disruption: "Minimise disruption",
};

function minutesLabel(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}

function moneyLabel(cents: number | null, unknownLabel = "unknown"): string {
  if (cents == null) return unknownLabel;
  return `$${(cents / 100).toFixed(2)}`;
}

function deltaLabel(seconds: number | null): string {
  if (seconds == null) return "unknown";
  if (seconds === 0) return "no time difference";
  const minutes = Math.round(Math.abs(seconds) / 60);
  const unit = minutes === 1 ? "minute" : "minutes";
  return seconds > 0 ? `${minutes} ${unit} saved` : `${minutes} ${unit} extra`;
}

function CandidateCard({
  title,
  candidate,
  current,
}: {
  title: string;
  candidate: TrafficAwareRouteCandidate;
  current?: TrafficAwareRouteCandidate | null;
}) {
  const timeDelta =
    current && candidate.role !== "current"
      ? current.remainingDurationSeconds - candidate.remainingDurationSeconds
      : candidate.timeSavingSeconds;
  const costDelta =
    current && candidate.role !== "current"
      ? candidate.cost.operatingCostDifferenceCents
      : null;
  const accessibility =
    candidate.constraints.accessibilityPassed === null
      ? "needs review"
      : candidate.constraints.accessibilityPassed
        ? "pass"
        : "fail";
  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm">{candidate.label}</p>
      <ul className="mt-3 space-y-1 text-sm">
        <li>Remaining time: {minutesLabel(candidate.remainingDurationSeconds)}</li>
        <li>
          Advisory arrival (Sydney):{" "}
          {new Date(candidate.estimatedArrivalAt).toLocaleString("en-AU", {
            timeZone: "Australia/Sydney",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </li>
        <li>
          Operating cost: {moneyLabel(candidate.cost.totalRemainingCents)}
        </li>
        {candidate.role !== "current" ? (
          <li>Time compared with current: {deltaLabel(timeDelta)}</li>
        ) : null}
        {candidate.role !== "current" ? (
          <li>
            Operating-cost change:{" "}
            {costDelta == null
              ? "unknown"
              : `${costDelta < 0 ? "lower by" : "higher by"} ${moneyLabel(Math.abs(costDelta))}`}
          </li>
        ) : null}
        <li>
          Tolls:{" "}
          {candidate.cost.tollLineStatus === "insufficient_price_information"
            ? "unknown"
            : moneyLabel(candidate.cost.tollCents)}
        </li>
        <li>Accessibility: {accessibility}</li>
        <li>
          Source: {candidate.source}
          {candidate.liveTrafficUsed ? " with live traffic" : " — not live traffic"}
        </li>
      </ul>
      {candidate.hazardEvidence.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-sm">
          {candidate.hazardEvidence.map((hazard) => (
            <li key={`${hazard.id ?? hazard.headline}-${hazard.subCategory ?? ""}`}>
              {hazard.headline ?? hazard.subCategory ?? "Road hazard"}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function MajiJourneyIntelligencePanel({
  tripId,
  enabled,
  mode,
}: {
  tripId: string;
  enabled: boolean;
  mode: "driver" | "participant" | "operator";
}) {
  const [preference, setPreference] =
    useState<JourneyOptimisationPreference>("balanced");
  const [advice, setAdvice] = useState<RouteRecommendation | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"evaluate" | "dismiss" | "refer" | null>(
    null
  );
  const readOnly = mode === "driver";

  if (!enabled) return null;

  async function evaluate() {
    setBusy("evaluate");
    setStatus(null);
    try {
      const res = await fetch(`/api/transport/trips/${tripId}/route-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference }),
      });
      const json = (await res.json()) as RouteRecommendation & { error?: string };
      if (!res.ok) {
        setStatus(json.error ?? "Could not compare remaining routes.");
        return;
      }
      setAdvice(json);
      setStatus(json.explanation);
    } catch {
      setStatus("Could not compare remaining routes. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function decide(decision: "dismissed" | "referred") {
    if (!advice) return;
    setBusy(decision === "dismissed" ? "dismiss" : "refer");
    setStatus(null);
    try {
      const res = await fetch(
        `/api/transport/trips/${tripId}/route-advice/${advice.adviceId}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        }
      );
      const json = (await res.json()) as RouteRecommendation & { error?: string };
      if (!res.ok) {
        setStatus(json.error ?? "Could not save that review action.");
        return;
      }
      setAdvice(json);
      setStatus(
        decision === "dismissed"
          ? "Comparison dismissed. The trip and quote were not changed."
          : "An operator can review this comparison. The trip and quote were not changed."
      );
    } catch {
      setStatus("Could not save that review action.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-border bg-card p-4"
      aria-labelledby="maji-heading"
    >
      <div className="space-y-2">
        <h2 id="maji-heading" className="font-semibold">
          Journey Intelligence (advisory)
        </h2>
        <p className="text-sm text-muted-foreground">{MAJI_ADVISORY_COPY}</p>
      </div>

      {!readOnly ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Comparison preference</legend>
          <div className="flex flex-col gap-2">
            {JOURNEY_OPTIMISATION_PREFERENCES.map((value) => (
              <label
                key={value}
                className="flex min-h-11 items-center gap-3 text-sm"
              >
                <input
                  type="radio"
                  name="maji-preference"
                  value={value}
                  checked={preference === value}
                  onChange={() => setPreference(value)}
                  className="size-4"
                />
                {PREFERENCE_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-sm">
          Remaining-route comparison is read-only while driving. A participant
          or operator can request a review.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className="min-h-11 min-w-11"
          disabled={busy !== null}
          onClick={() => void evaluate()}
        >
          {busy === "evaluate" ? "Comparing…" : "Compare remaining routes"}
        </Button>
        {!readOnly && advice ? (
          <>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 min-w-11"
              disabled={busy !== null}
              onClick={() => void decide("dismissed")}
            >
              Dismiss comparison
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 min-w-11"
              disabled={busy !== null}
              onClick={() => void decide("referred")}
            >
              Request operator review
            </Button>
          </>
        ) : null}
      </div>

      <p className="text-sm" role="status" aria-live="polite">
        {status ?? "No comparison yet. This does not cancel the trip."}
      </p>

      {advice ? (
        <div className="space-y-3">
          <p className="text-sm">{advice.provenance.sydneyFreshnessLabel}</p>
          <p className="text-sm">
            Accepted quote (read-only):{" "}
            {moneyLabel(advice.acceptedQuoteTotalCents, "not on file")}
          </p>
          {advice.current ? (
            <CandidateCard title="Current remaining route" candidate={advice.current} />
          ) : null}
          {advice.recommended ? (
            <CandidateCard
              title="Recommended alternative (not activated)"
              candidate={advice.recommended}
              current={advice.current}
            />
          ) : null}
          {advice.alternatives.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              title="Other option"
              candidate={candidate}
              current={advice.current}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
